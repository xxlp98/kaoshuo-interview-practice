const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "../考研复试题库及答案");
const outQ = path.resolve(__dirname, "../question-bank.json");
const outA = path.resolve(__dirname, "../answer-bank.json");

const files = fs
  .readdirSync(baseDir)
  .filter((f) => f.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

const questions = [];
const answers = [];
let nextId = 5001;

function slugify(input) {
  return (
    input
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "topic"
  );
}

for (let topicIndex = 0; topicIndex < files.length; topicIndex += 1) {
  const file = files[topicIndex];
  const topicTitleCn = path.basename(file, ".md");
  const topicTitleEn = topicTitleCn;
  const topicId = `topic-${topicIndex + 1}-${slugify(topicTitleCn)}`;

  const raw = fs.readFileSync(path.join(baseDir, file), "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  let orderInTopic = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const header = lines[i].trim();
    const m = header.match(/^\d+\.\s+\*\*(.+?)\*\*\s*$/);
    if (!m) {
      continue;
    }

    let questionEn = m[1].trim();
    let questionCn = "";
    if (questionEn.includes(" / ")) {
      const parts = questionEn.split(" / ");
      questionEn = parts[0].trim();
      questionCn = parts.slice(1).join(" / ").trim();
    }

    const paragraphs = [];
    let buffer = [];
    let j = i + 1;

    while (j < lines.length) {
      const current = lines[j].trim();
      if (/^\d+\.\s+\*\*(.+?)\*\*\s*$/.test(current)) {
        break;
      }

      const isAudioLine = /^\[.*\]\(.*\)\s*$/.test(current);
      if (!current || isAudioLine) {
        if (buffer.length) {
          paragraphs.push(buffer.join(" ").replace(/\s+/g, " ").trim());
          buffer = [];
        }
      } else {
        buffer.push(current);
      }
      j += 1;
    }

    if (buffer.length) {
      paragraphs.push(buffer.join(" ").replace(/\s+/g, " ").trim());
    }

    orderInTopic += 1;
    const simpleEn = paragraphs[0] || "";
    const simpleCn = paragraphs[1] || "";

    questions.push({
      id: nextId,
      part: "all",
      topic_id: topicId,
      topic_title_en: topicTitleEn,
      topic_title_cn: topicTitleCn,
      topic_order: topicIndex + 1,
      order: orderInTopic,
      question_en: questionEn,
      question_cn: questionCn || topicTitleCn,
    });

    answers.push({
      id: nextId,
      simple_en: simpleEn,
      simple_cn: simpleCn,
      advanced_en: simpleEn,
      advanced_cn: simpleCn,
    });

    nextId += 1;
    i = j - 1;
  }
}

fs.writeFileSync(outQ, JSON.stringify(questions, null, 2) + "\n", "utf8");
fs.writeFileSync(outA, JSON.stringify(answers, null, 2) + "\n", "utf8");

console.log(`generated questions=${questions.length}, answers=${answers.length}`);
