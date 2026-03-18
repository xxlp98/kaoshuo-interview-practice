#!/usr/bin/env python3
# pyright: reportMissingImports=false
"""Batch-generate IELTS speaking audio files from question/answer banks via Edge-TTS.

Outputs:
- assets/audio/<question_id>/topic.mp3
- assets/audio/<question_id>/simple.mp3
- assets/audio/<question_id>/advanced.mp3
- audio-manifest.json
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
from pathlib import Path
from typing import Dict, List

import edge_tts

TEXT_FIELDS = {
    "topic": "question_en",
    "simple": "simple_en",
    "advanced": "advanced_en",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Edge-TTS audio from question bank")
    parser.add_argument(
        "--question-bank",
        default="question-bank.json",
        help="Path to question-bank.json",
    )
    parser.add_argument(
        "--answer-bank",
        default="answer-bank.json",
        help="Path to answer-bank.json",
    )
    parser.add_argument(
        "--output-dir",
        default="assets/audio",
        help="Directory where MP3 files will be generated",
    )
    parser.add_argument(
        "--manifest",
        default="audio-manifest.json",
        help="Output JSON manifest path",
    )
    parser.add_argument(
        "--voice",
        default="en-US-JennyNeural",
        help="Edge voice name, e.g. en-US-JennyNeural",
    )
    parser.add_argument(
        "--rate",
        default="+0%",
        help="Speech rate for Edge-TTS, e.g. +0%% or -8%%",
    )
    parser.add_argument(
        "--pitch",
        default="+0Hz",
        help="Speech pitch for Edge-TTS, e.g. +0Hz",
    )
    parser.add_argument(
        "--volume",
        default="+0%",
        help="Speech volume for Edge-TTS, e.g. +0%%",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate audio even if target MP3 already exists",
    )
    return parser.parse_args()


def load_question_bank(path: Path) -> List[Dict]:
    if not path.exists():
        raise FileNotFoundError(f"Question bank not found: {path}")

    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    if not isinstance(data, list) or not data:
        raise ValueError("question-bank.json must be a non-empty array")

    return data


def normalize_text(value: str) -> str:
    return " ".join((value or "").strip().split())


def load_answer_bank(path: Path) -> Dict[str, Dict]:
    if not path.exists():
        return {}

    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    if not isinstance(data, list):
        return {}

    answer_map: Dict[str, Dict] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        question_id = str(item.get("id", "")).strip()
        if not question_id:
            continue
        answer_map[question_id] = item

    return answer_map


async def synthesize_to_file(
    text: str,
    output_path: Path,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    communicator = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        volume=volume,
    )
    await communicator.save(str(output_path))


async def generate_audio(args: argparse.Namespace) -> None:
    project_root = Path.cwd()
    question_bank_path = project_root / args.question_bank
    answer_bank_path = project_root / args.answer_bank
    output_dir = project_root / args.output_dir
    manifest_path = project_root / args.manifest

    questions = load_question_bank(question_bank_path)
    answers = load_answer_bank(answer_bank_path)

    manifest = {
        "meta": {
            "generator": "edge-tts",
            "voice": args.voice,
            "rate": args.rate,
            "pitch": args.pitch,
            "volume": args.volume,
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        },
        "items": {},
    }

    generated_count = 0
    skipped_count = 0

    for question in questions:
        question_id = str(question.get("id", "")).strip()
        if not question_id:
            continue

        item_manifest: Dict[str, str] = {}
        answer_item = answers.get(question_id, {})

        for role, field_name in TEXT_FIELDS.items():
            if role == "topic":
                text = normalize_text(str(question.get(field_name, "")))
            else:
                # Preferred source is answer-bank.json; fallback keeps backward compatibility.
                text = normalize_text(str(answer_item.get(field_name, "") or question.get(field_name, "")))
            if not text:
                continue

            output_path = output_dir / question_id / f"{role}.mp3"
            rel_path = output_path.relative_to(project_root).as_posix()
            item_manifest[role] = rel_path

            if output_path.exists() and not args.force:
                skipped_count += 1
                continue

            await synthesize_to_file(
                text=text,
                output_path=output_path,
                voice=args.voice,
                rate=args.rate,
                pitch=args.pitch,
                volume=args.volume,
            )
            generated_count += 1

        manifest["items"][question_id] = item_manifest

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Questions processed: {len(questions)}")
    print(f"Answer entries loaded: {len(answers)}")
    print(f"Audio generated: {generated_count}")
    print(f"Audio skipped (already exists): {skipped_count}")
    print(f"Manifest written: {manifest_path}")


def main() -> None:
    args = parse_args()
    asyncio.run(generate_audio(args))


if __name__ == "__main__":
    main()
