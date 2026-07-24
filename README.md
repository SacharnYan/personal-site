# 思想名片 — 个人网站

严树成的个人网站，线上地址 **https://sacharn.site**。
风格对齐 Steve Jobs Archive：纯白底、衬线大字、极重留白、克制动效。
全站双语：中文在根路径，英文镜像在 `/en/` 下，页面一一对应。

## 技术栈

- **Astro** — 静态生成，零运行时，HTML 直接出（62 页）
- **纯 CSS** — 不上 Tailwind / UI 库
- **Markdown + JSON** — 内容文件，不依赖 CMS
- **Cloudflare Pages** — 推送 `main` 分支自动构建发布

## 目录结构

```
src/
  pages/               # 中文路由（根路径）
    en/                # 英文镜像路由（/en/ 前缀，结构与中文一一对应）
  components/pages/    # 页面组件：双语共用，靠 lang 属性区分（<WritingIndex lang="en" />）
  layouts/Base.astro   # 复用布局：导航抽屉、页脚、fade-in、语言切换
  i18n/ui.ts           # 双语字典 + 路由/日期助手
  content/writing/     # 中文文章（content collection）
  content/writing-en/  # 英文译文（同 slug，与中文一一对应）
  data/
    index.json         # 首页卡片（含 en 块）
    notes.json         # 随记（text + text_en）
    photos.json        # 照片（title + title_en）
public/                # 图片、视频、favicon 等静态资源
scripts/               # verify-*.mjs 验证脚本（Playwright 跑 dist）
dist/                  # build 产物（不提交）
```

## 双语架构

### 路由

- 每个中文页 `src/pages/x.astro` 都有一个英文镜像 `src/pages/en/x.astro`；
  两者都只写一行：`<PageComponent lang="zh" />` / `<PageComponent lang="en" />`，
  实际渲染逻辑在 `src/components/pages/` 的共用组件里。
- `src/i18n/ui.ts` 提供：
  - `t(lang, key)` — 界面文案字典（菜单、页脚、按钮等）
  - `href(lang, path)` — 给站内链接加语言前缀
  - `switchPath(lang, pathname)` — 菜单语言切换器的目标地址
  - `fmtDate(lang, date)` — 中文 `2024.01.20` / 英文 `Jan 20, 2024`

### 写作（重点）

- 中文文章：`src/content/writing/<slug>.md`
- 英文译文：`src/content/writing-en/<slug>.md`（**文件名必须相同**，
  frontmatter 的 title/sub/description 直接写英文，date 与中文一致）
- 英文文章页逻辑（`WritingPost.astro`）：
  - `writing-en` 里有同 slug 译文 → 直接渲染英文正文
  - 没有译文 → 回退中文正文 + 顶部提示条，列表页标题旁挂 `In Chinese` 徽标
- 文章内的图片若带中文（如示意图），在 `public/writing/<slug>/` 下加 `<name>-en.png`，
  译文里引用英文版图片；中文原文不动。

### 随记 / 照片 / 首页卡片

- 随记：`src/data/notes.json`，每条 `text`（中）+ `text_en`（英）。
  英文随记页只渲染 `text_en`，缺了会在验证脚本里报错。
- 照片：`src/data/photos.json`，`title` + `title_en`。
- 首页卡片：`src/data/index.json`，中文字段平铺，英文放在 `en` 子对象里。

## 日常工作流

### 加一篇新文章

1. 写中文：`src/content/writing/<slug>.md`
2. 写译文：`src/content/writing-en/<slug>.md`（可以后补，未补时英文页自动回退）
3. 验证（见下），推送

### 加一条随记

`notes.json` 加 `{ date, text, text_en }`，中英文都写。

### 加照片

1. 图片放进 `public/photos/`
2. `photos.json` 加 `{ id, src, title, title_en, date }`

### 验证（提交前必跑）

```bash
npm.cmd run build              # 构建 62 页
node scripts/verify-i18n.mjs   # 双语主验证（镜像存在、界面字、译文、徽标、无中文残留等 ~68 项）
node scripts/verify-photos.mjs        # 照片墙与卡牌详情
node scripts/verify-writing-migration.mjs  # 中文文章完整性
```

验证脚本用 Playwright 起本地静态服务跑 `dist`，全绿才算完。
截图类断言会产出 `shot-*.png`，已被 .gitignore 屏蔽，**不要提交截图**。

### 环境注意

- Git Bash 里用 `npm.cmd`（直接 `npm` 会卡）
- 页面内联脚本只写 ES5 经典语法（老手机内核）
- `data-fade` 淡入只用于小元素，别套大容器

## 部署

推送 `main` → Cloudflare Pages 自动构建（`npm run build`，输出 `dist`）→ sacharn.site 更新。
构建状态可查：
`curl -s "https://api.github.com/repos/SacharnYan/personal-site/commits/main/check-runs"`

## 设计宪法（不可随意改）

- 纯白底、衬线字体（`--font-display` / `--font-body`）、极重留白
- 黑 / 白 / 灰阶，不用彩色、emoji、阴影堆砌
- 动效只用 fade-in，不玩 parallax / scroll-jacking
- 正文栏居中（对齐 SJA about 页），不大面积左对齐留白

改版决策的完整记录见 `REDESIGN.md`。改任何一条宪法之前先想清楚——一旦破例，就会开始丑。
