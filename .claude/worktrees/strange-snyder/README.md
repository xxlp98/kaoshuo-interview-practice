# 考研复试口语练习网站

这是一个纯静态网页项目，面向考研复试英语口语训练，不依赖后端，适合直接部署到 GitHub + Netlify。

## 核心功能

- 单一综合题库（不再区分 part1/part2/part3）
- 题目与参考回答展示
- 历史记录（本地浏览器存储）
- 语音优先使用离线 mp3，缺失时自动回退浏览器 TTS

## 项目结构

- index.html：入口页
- practice.html：练习页
- question-bank.json：题目库
- answer-bank.json：答案库
- audio-manifest.json：离线音频索引
- assets/audio/：离线音频文件
- scripts/build_exam_bank.js：从 md 题库源构建 JSON
- scripts/generate_edge_audio.py：按 JSON 批量生成音频
- 考研复试题库及答案/：题库源 markdown（按主题拆分）
- docs/题库来源索引.md：题库源文件清单与维护说明

## 本地运行

在项目根目录执行：

```bash
python3 -m http.server 5500
```

浏览器访问：

```text
http://localhost:5500
```

## 题库更新流程

1. 修改题库源 markdown 文件（位于 `考研复试题库及答案/`）。
2. 重新构建题库 JSON。
3. 可选：重新生成离线音频。
4. 提交并推送到 GitHub，Netlify 自动发布。

### 1) 重新构建题库 JSON

```bash
node scripts/build_exam_bank.js
```

该命令会更新：

- question-bank.json
- answer-bank.json

### 2) 重新生成离线音频（可选）

首次安装依赖：

```bash
pip3 install -r requirements-audio.txt
```

生成音频（仅缺失文件）：

```bash
python3 scripts/generate_edge_audio.py
```

强制重生成全部音频：

```bash
python3 scripts/generate_edge_audio.py --force
```

该命令会更新：

- assets/audio/
- audio-manifest.json

## 抽题与历史记录逻辑

1. 抽取话题时优先未练习话题。
2. 进入话题后先展示该话题第 1 题。
3. 支持在同一话题内继续抽取新题。
4. 当综合题库的话题都被抽完，会自动重置话题池。
5. 历史记录保存在浏览器本地，不依赖后端。

## GitHub 部署（首次）

如果仓库还未关联远端，执行：

```bash
git init
git add .
git commit -m "feat: 初始化考研复试口语项目"
git branch -M main
git remote add origin https://github.com/xxlp98/kaoshuo-interview-practice.git
git push -u origin main
```

日常更新：

```bash
git add .
git commit -m "chore: 更新题库/音频"
git push
```

## Netlify 自动同步发布

1. 登录 Netlify，点击 Add new site -> Import an existing project。
2. 连接 GitHub，选择本仓库。
3. 部署参数保持默认即可（本项目已有 `netlify.toml`）：
	- publish directory: `.`
	- build command: 留空
4. 点击 Deploy。

完成后，每次向 GitHub 的主分支 push，Netlify 会自动重新部署。

## 正式环境与测试环境（推荐）

建议使用两套分支 + 两套 Netlify 站点：

- 正式环境：`main` 分支，绑定正式域名。
- 测试环境：`staging` 分支，使用 Netlify 测试域名（例如 `staging--<site>.netlify.app`）。

推荐做法：

1. 在 GitHub 创建 `staging` 分支。
2. 在 Netlify 复制一份站点作为测试站，连接同一仓库。
3. 测试站的 Production branch 设为 `staging`。
4. 正式站继续使用 `main`。

这样你可以先把改动 push 到 `staging` 做验证，通过后再合并到 `main`。

## 在测试环境启用 CDN 加速

项目已内置“测试域名自动走 CDN，正式域名走源站”的逻辑：

- 测试环境（如 `staging--...netlify.app`）默认使用 jsDelivr 加载：
	- `question-bank.json`
	- `answer-bank.json`
	- `audio-manifest.json`
	- `assets/audio/*`
- 正式环境默认不启用 CDN，行为保持稳定。

可用 URL 参数手动覆盖：

- 强制开启 CDN：`?cdn=1`
- 强制关闭 CDN：`?cdn=0`
- 指定 CDN 分支：`?cdnBranch=staging`

示例：

- `https://你的测试域名/practice.html?cdn=1&cdnBranch=staging`

说明：

- 当前 CDN 源为 `https://cdn.jsdelivr.net/gh/xxlp98/kaoshuo-interview-practice@<branch>`。
- 若你在测试环境用其他分支试验，可通过 `cdnBranch` 参数切换。

## 前端错误上报（Netlify Functions）

项目已内置轻量错误上报端点：

- 端点：`/.netlify/functions/report-client-error`
- 函数文件：`netlify/functions/report-client-error.js`
- 触发时机：页面运行时异常（`window.error` / `unhandledrejection`）

上报字段包含：

- 错误类型与错误信息
- stack（截断后）
- 页面 URL、source、行列号
- 浏览器 UA、语言、视口尺寸、referrer
- Netlify request id 与来源 IP（由平台头部提供）

如何查看日志：

1. 打开 Netlify 对应站点后台。
2. 进入 Functions -> `report-client-error`。
3. 在函数日志中搜索关键字：`[client-error-report]`。

说明：

- 该方案不依赖自建后端，适合先定位线上白屏与偶发错误。
- 前端已做 5 秒去重上报，避免同一错误短时间内重复刷日志。

## 缓存与更新说明

- HTML 与 JSON 走 no-cache，保证题库与索引及时更新。
- 音频文件使用长缓存（immutable），如果你重生成了同路径音频，建议在必要时清理 CDN 缓存或更换文件名策略。

## 数据字段说明

question-bank.json 每题字段：

- id
- part（统一为 `all`）
- topic_id
- topic_title_en
- topic_title_cn
- topic_order
- order
- question_en
- question_cn

answer-bank.json 每题字段：

- id（与题目 id 对应）
- simple_en
- simple_cn
- advanced_en
- advanced_cn
