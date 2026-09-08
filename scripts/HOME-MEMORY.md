# 我的家：加载和内存边界

2026-09-08，本地修复。用户报告 T14 / Core Ultra 7 155H、32 GB RAM、双外接屏，欢迎页面无操作时页面进程持续增长到约 7 GB。本机未复现该持续增长，不应将分辨率优化等同于已查明现场根因。

## 入口与调度

- `public/home/index.html` 只加载 `boot.js`。静态欢迎页使用现有 `images/home-night.png`，点击进入后才下载应用 bundle 和模型、创建 WebGL。模型准备好后自动进入，仍然只需一次点击。
- 应用层在 `public/home/bundle.19793ffb1086fd2d.js` 中；此仓库保存的是构建产物。若未来从原开发项目重新导入 bundle，必须迁移本次调度与生命周期修改，并重新跑回归测试，不能只覆盖此文件。
- 像素比不超过 1，总渲染像素不超过 1,500,000；后期沿用 renderer 的预算；关闭 MSAA，将阴影图从 2048 降为 1024。保留 SSAO、辉光、镜面、模型和材质。高分屏锐度及阴影细节有所降低。
- 相机移动、控制器 change、窗口大小、昼夜渐变才触发绘制，最高 30 FPS；静止停止绘制。保留轻量 RAF 调度，用于检测控制器和过渡状态。
- 静态场景阴影仅在首次需要时生成。昼夜渐变通过 onUpdate 请求重绘。
- hidden / pagehide 暂停绘制；持久化 pagehide 保留场景供 pageshow 恢复。非持久化离页释放控制器、场景资源、后期目标、renderer 与 context。

## 验证

启动 `npm.cmd run dev -- --host 127.0.0.1 --port 4321`，然后：

```
node scripts/verify-home-memory.mjs
npm.cmd run build
```

Astro dev 的 public 子目录使用 `/home/index.html`。可用环境变量 HOME_TEST_URL 指向其他本地服务；HOME_TEST_SHOTS 指向截图目录。测试只在响应中临时暴露 app，不把调试全局写进发布代码。

覆盖：欢迎页零 WebGL/零 bundle 与模型请求；一次点击进入；静止停止绘制；昼夜渐变持续绘制；房间导航；自动旋转；模拟 persisted pagehide/pageshow；4K 像素预算；静置资源计数；完整销毁。另在 390×844 验证了欢迎页无横向溢出及 bundle 下载失败后的静态预览。

## 测量与限制

Chrome headless，Intel Iris Xe / ANGLE D3D11，1440×900 CSS、DPR 2；GPU PID 经 CDP 获取，数字是 Windows WorkingSet64（GPU 进程系统内存，非显存、非单页 JS 堆）。

- 原版本独立浏览器：GPU 进程约 1245 MiB。约 90 秒采样区间 1133–1215 MiB，createTexture=27、texImage2D=28 保持不变，未复现用户的无限增长。
- 本地修改后：静态欢迎页约 268 MiB；进入模型约 476 MiB，15 秒后约 461 MiB。不同进程运行有缓存和驱动波动，不作为所有设备的固定内存保证。
- 静止场景 15 秒前后帧计数相同，geometry/texture 为 97/24 不增长。这个检查证明不继续绘制，不代表完整证明所有驱动都不存在泄漏。
- 未在 T14 上复验，未发布。真实多屏驱动路径、长期主动旋转、实际 bfcache 往返仍需现场或后续验证。持久化生命周期当前为合成事件回归。
