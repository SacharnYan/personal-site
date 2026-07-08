# 思想名片 — 个人网站

风格参考 Steve Jobs Archive：纯白底、近乎手写体的衬线大字、极重留白、克制动效。

## 技术栈

- **Astro 4** — 静态生成，零运行时，HTML 直接出
- **Cloudflare Pages**（计划）— 全球 CDN，大陆走香港/日本节点
- **纯 CSS** — 不上 Tailwind / UI 库
- **Markdown + JSON** — 内容文件，不依赖 CMS

## 目录结构

```
src/
  pages/             # 路由 = 文件路径
    index.astro      # 首页（5 个内容块的入口）
    about.astro      # 关于
    projects/        # 项目柜
    writing/         # 写作柜
    photos/          # 照片柜
    vlog/            # vlog 柜
    life/            # 生活记录柜
  layouts/
    Base.astro       # 复用布局：导航、页脚、fade-in 脚本
  styles/
    global.css       # 全局样式（颜色、字号、间距、动效）
  content/
    index.json       # 首页 5 个内容块的数据
public/
  favicon.svg
dist/                # build 产物（自动生成）
```

## 日常维护

### 改首页内容
编辑 `src/content/index.json`——只改这个文件，标题/副标/CTA 都在这里。

### 加新文章 / 新项目
Astro 的 content collections 已经预置（之后可以加 schema 校验）。现在直接：

1. 在 `src/content/projects/` 创建 `2026-07-my-project.md`
2. 在 `src/pages/projects/index.astro` 里加一行链接到它

如果文章多，可以加 `getCollection()` 自动列出——告诉我数量和频率我来加。

### 加照片
1. 把图丢到 `public/photos/`
2. 在 `src/pages/photos/index.astro` 里加 `<img>`

### 本地预览
```bash
cd C:\Users\sacha\personal-site
node node_modules/astro/astro.js dev --host 127.0.0.1 --port 4321
# 浏览器打开 http://127.0.0.1:4321
```

> 注：MSYS 环境下用 `node node_modules/astro/astro.js` 直接调，**不要用 `npm run dev`**——`npm` 在这个 shell 下会卡住。如果你要在 Windows Terminal / PowerShell 里跑，`npm run dev` 没问题。

### 改样式
只改 `src/styles/global.css`。所有设计 token（颜色、字号、间距）都在文件顶部的 `:root` 里。

## 部署到 Cloudflare Pages

1. 把这个目录 push 到 GitHub（公开或私有都行）
2. 登录 Cloudflare → Pages → Connect to Git
3. 选你的 repo，build 配置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20
4. 绑定你的域名（阿里云/腾讯云注册后改 NS 到 Cloudflare）

> 备注：当前 `package.json` 里 `astro` 是从 npm 装的。**等正式上线前**，我建议把 `astro` 升级到最新稳定版，并加 `astro check` 做类型校验（你 Java 后端背景应该会喜欢这个）。

## 待办（你来定优先级）

- [ ] 首页 5 个 block 的实际内容
- [ ] 项目页：把花艺工具的"故事"写完整
- [ ] 写作页：加 content collection，自动列文章
- [ ] 照片页：决定是 grid 还是时间轴
- [ ] vlog 页：决定是嵌入 B 站/YouTube iframe，还是自托管
- [ ] 头像 / logo：现在是简化的人形剪影占位
- [ ] 域名：注册并绑定
- [ ] Google Search Console / 简单 SEO

## 设计决策（不可随意改）

- **只有 6 个字号**：12 / 14 / 16 / 20 / 28 / 40
- **只有 2 个字重**：400 / 500
- **只有 3 个颜色**：黑、白、一种暖棕褐
- **不用圆角 / 阴影 / emoji**
- **动效只用 fade-in**——不玩 parallax、不玩 scroll-jacking

这是网站的"宪法"。改任何一条都先想清楚——一旦破例，就会开始丑。
