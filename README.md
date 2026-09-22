# onesprod.com — static site (Astro)

International production company ONES — Barcelona · Warsaw · Bangkok.

- `src/data/projects.json` — all portfolio entries (reel, TV shows, photoshoots, showcase, production service). Add a project = add an object here + drop its thumbnail in `public/media/thumbs/<slug>.webp`.
- `src/data/people.json` — roster (directors & photographers) with reels, works and galleries.
- `src/data/site.json` — texts (about, production service PL / Asia / Spain, film), team, offices, cities.
- `src/data/logos.json` + `public/media/logos/` — clients wall.
- `public/contact.php` — contact form handler (works on Hostinger; not on the GitHub Pages preview).

## Run
```
npm ci
npm run dev          # local preview
npm run build        # production build → dist/  (base "/", site https://onesprod.com)
npm run build:pages  # GitHub Pages build (base "/onesprod")
```
Every push to `main` builds and deploys the preview to GitHub Pages (`.github/workflows/deploy.yml`).
