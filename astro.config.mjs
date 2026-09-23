import { defineConfig } from 'astro/config';

// GitHub Pages preview: https://sapicturez.github.io/onesprod/  (DEPLOY_TARGET=pages)
// Production (Hostinger, own domain): DEPLOY_TARGET unset → site https://onesprod.com, base '/'
const pages = process.env.DEPLOY_TARGET === 'pages';

export default defineConfig({
  site: pages ? 'https://sapicturez.github.io' : 'https://onesprod.com',
  base: pages ? '/onesprod' : '/',
  trailingSlash: 'always',
  // CSS inlined into every page and JS under a stable name: a freshly deployed page never points
  // at a hashed asset that the previous deploy removed (GitHub Pages caches HTML for 10 min).
  build: { format: 'directory', assets: 'assets', inlineStylesheets: 'always' },
  vite: { build: { rollupOptions: { output: { entryFileNames: 'assets/[name].js', chunkFileNames: 'assets/[name].js', assetFileNames: 'assets/[name][extname]' } } } },
  compressHTML: true,
});
