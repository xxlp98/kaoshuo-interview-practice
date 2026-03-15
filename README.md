# 雅思口语练习网站

这是一个纯静态网站，可直接部署为公网网址（不需要后端）。

## 页面结构

- `index.html`：起始页。首次点击“随机抽取并开始”后跳转到练习页。
- `practice.html`：练习页。支持抽题、查看题目、口语答案、语速控制、历史侧边栏。

从 `index.html` 跳转时会带 `?autostart=1`，进入 `practice.html` 后自动抽第一题并自动朗读题干。

## Edge-TTS 离线音频（默认优先）

`practice.html` 会优先读取本地生成音频（`audio-manifest.json` + `assets/audio/**/*.mp3`），若缺失再回退浏览器 TTS。

### 1. 安装依赖

```bash
python3 -m pip install -r requirements-audio.txt
```

### 2. 批量生成题库音频

```bash
python3 scripts/generate_edge_audio.py
```

默认使用 `en-US-JennyNeural`，可自定义：

```bash
python3 scripts/generate_edge_audio.py --voice en-US-AriaNeural --rate -4% --pitch +0Hz
```

如果你修改了题库并希望强制重生成：

```bash
python3 scripts/generate_edge_audio.py --force
```

生成结果：
- `audio-manifest.json`
- `assets/audio/<题号>/topic.mp3`
- `assets/audio/<题号>/simple.mp3`
- `assets/audio/<题号>/advanced.mp3`

## 本地预览（避免 file:// JSON 读取限制）

在项目目录执行：

```bash
python3 -m http.server 5500
```

浏览器访问：

```text
http://localhost:5500
```

## 一键分享网址（Netlify）

### 方式 1：Netlify Drop（最快）

1. 打开 https://app.netlify.com/drop
2. 把整个项目文件夹拖进去（至少包含 `index.html`、`practice.html`、`question-bank.json`、`audio-manifest.json`、`assets/audio/`）
3. 上传完成后会自动生成公网网址，直接分享该网址

### 方式 2：GitHub + Netlify（推荐长期维护）

1. 把项目上传到 GitHub 仓库
2. 在 Netlify 点击 `Add new site` -> `Import an existing project`
3. 选择该仓库
4. 构建配置使用：
   - Build command: 留空
   - Publish directory: `.`
5. 点击 Deploy，得到固定公网域名

## 题库维护

- 题库文件：`question-bank.json`（由 `practice.html` 读取）
- 音频清单：`audio-manifest.json`（由 `practice.html` 读取）
- 每道题格式字段：
  - `id`
  - `topic_en`
  - `topic_cn`
  - `simple_en`
  - `simple_cn`
  - `advanced_en`
  - `advanced_cn`

注意：`id` 建议唯一且不重复。
