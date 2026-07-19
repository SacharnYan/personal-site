import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sacharn.site',
  // 不开 image optimization（个人站不必要，且会拖慢大陆访问）
  // 不开 prefetch（SJA 风格的克制感不需要预取）
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    build: {
      // 兼容老内核：script 产物保持 ES2015 语法
      // （老 WebView 支持 module 但不支持 ES2019 的 optional catch binding `catch{}`，
      //   会整段解析失败导致主脚本不执行、页面空白）
      target: 'es2015',
    },
    esbuild: {
      target: 'es2015',
    },
  },
});
