import { defineConfig } from 'astro/config';

// GitHub Pages preview: https://sapicturez.github.io/onesprod/  (DEPLOY_TARGET=pages)
// Production (Hostinger, own domain): DEPLOY_TARGET unset → site https://onesprod.com, base '/'
const pages = process.env.DEPLOY_TARGET === 'pages';

export default defineConfig({
  site: pages ? 'https://sapicturez.github.io' : 'https://onesprod.com',
  base: pages ? '/onesprod' : '/',
  trailingSlash: 'always',
  build: { format: 'directory', assets: 'assets' },
  compressHTML: true,
});
