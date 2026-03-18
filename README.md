# 雅思口语练习网站

这是一个纯静态网站，可直接部署为公网网址（不需要后端）。

## 页面结构

- `index.html`：起始页。首次点击“抽取话题并开始”后跳转到练习页。
- `practice.html`：练习页。支持 Part 1/2/3 左侧切换、话题优先抽取、查看题目、语速控制、历史侧边栏。

说明：右侧练习记录按 Part 独立保存。切换 Part 后，会自动切到该 Part 自己的抽题进度和历史记录。

从 `index.html` 跳转时会带 `?autostart=1`，进入 `practice.html` 后自动抽取一个话题，并自动提问该话题第一个问题。

## 抽题规则（话题优先）

1. 点击“抽取话题”时，会先随机抽取一个未练习过的话题。
2. 进入该话题后，先自动提问该话题第一个问题（Q1）。
3. 继续点击按钮时，会在该话题剩余问题中随机抽取。
4. 当该话题问题全部抽完，会弹窗提示并自动切换到下一个话题。
5. 当某个 Part 的全部话题都抽完，会自动重置该 Part 的话题池。

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

## GitHub 推送教程（xxlp98）

当前项目远程仓库：`https://github.com/xxlp98/ielts-speaking-practice`

### 首次连接（新项目）

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/xxlp98/ielts-speaking-practice.git
git push -u origin main
```

说明：
- 已通过 `.gitignore` 忽略 `.venv/` 等本地文件，避免提交无关内容。
- 如果提示认证失败，请使用 GitHub Personal Access Token（PAT）作为密码。

### 日常更新推送

每次改完代码后执行：

```bash
git add .
git commit -m "更新说明"
git push
```

### 常用排查命令

```bash
git status -sb
git remote -v
git log --oneline -n 5
```

## 一键分享网址（Netlify）

### 方式 1：Netlify Drop（最快）

1. 打开 https://app.netlify.com/drop
2. 把整个项目文件夹拖进去（至少包含 `index.html`、`practice.html`、`question-bank.json`、`audio-manifest.json`、`assets/audio/`）
3. 上传完成后会自动生成公网网址，直接分享该网址

### 方式 2：GitHub + Netlify（推荐长期维护）

1. 按上面的“GitHub 推送教程”把项目上传到 GitHub 仓库
2. 在 Netlify 点击 `Add new site` -> `Import an existing project`
https://app.netlify.com/projects/silly-paletas-ae94b7/deploys/69b69c18dce2ee85ebd4001a
3. 选择该仓库
4. 构建配置使用：
   - Build command: 留空
   - Publish directory: `.`
5. 点击 Deploy，得到固定公网域名

## 题库维护

- 题库文件：`question-bank.json`（由 `practice.html` 读取）
- 音频清单：`audio-manifest.json`（由 `practice.html` 读取）
- 每道题格式字段（当前话题优先版本）：
  - `id`
  - `part`（`part1` / `part2` / `part3`）
  - `topic_id`（同一话题内问题共享）
  - `topic_title_en`
  - `topic_title_cn`
  - `topic_order`（话题顺序）
  - `order`（话题内问题顺序，Q1 建议设为 1）
  - `question_en`
  - `question_cn`

注意：
- `id` 建议全局唯一且不重复。
- 同一话题请保持相同 `topic_id`。
- 若希望“先问第一题”，请确保每个话题至少有一条 `order = 1` 的问题。
