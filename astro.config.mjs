import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  // 不开 image optimization（个人站不必要，且会拖慢大陆访问）
  // 不开 prefetch（SJA 风格的克制感不需要预取）
  server: {
    port: 4321,
    host: true,
  },
});
