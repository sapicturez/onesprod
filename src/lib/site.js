import projects from '../data/projects.json';
import people from '../data/people.json';
import logos from '../data/logos.json';
import site from '../data/site.json';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Prefix a root-relative path with the deploy base ('' locally, '/onesprod' on GitHub Pages). */
export const u = (p) => (p.startsWith('/') ? base + p : p);

export const NAV = [
  ['/reel/', 'TVC Reel'],
  ['/tv-shows/', 'TV Shows'],
  ['/films/', 'Films'],
  ['/photoshoots/', 'Photoshoots'],
  ['/production-service/', 'Production Service'],
  ['/showcase/', 'Showcase'],
  ['/roster/', 'Roster'],
  ['/clients/', 'Clients'],
  ['/about/', 'About us'],
  ['/contact/', 'Contact'],
];

export const FOOTER_NAV = [];
export const bySection = (key) => projects.filter((p) => p.sections.includes(key));
export const reel = () => bySection('reel').sort((a, b) => a.order - b.order);
// Down The Road is pinned first; the rest newest first
const TV_PINNED = ['down-the-road'];
const pin = (p) => { const i = TV_PINNED.indexOf(p.slug); return i < 0 ? 99 : i; };
export const tvShows = () => bySection('tv-shows').sort((a, b) => pin(a) - pin(b) || b.year - a.year);
export const photoshoots = () => bySection('photoshoots');
export const showcase = () => bySection('showcase');
export const productionReel = () => site.production_service_reel.map((s) => projects.find((p) => p.slug === s)).filter(Boolean);
export const bySlug = (slug) => projects.find((p) => p.slug === slug);

/** "Agency: X / Director: Y" → [["Agency","X"],["Director","Y"]] */
export const creditPairs = (credits) => {
  const order = ['client', 'agency', 'production', 'director', 'photographer', 'dop', 'note'];
  const label = { client: 'Client', agency: 'Agency', production: 'Prod', director: 'Dir', photographer: 'Photo', dop: 'DOP', note: '' };
  return Object.entries(credits || {})
    .sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99))
    .map(([k, v]) => [label[k] ?? k[0].toUpperCase() + k.slice(1), v]);
};

export const vimeoHash = (id) => (site.vimeo_hash || {})[id] || '';
export const vimeoEmbed = (id) => `https://player.vimeo.com/video/${id}?${vimeoHash(id) ? 'h=' + vimeoHash(id) + '&' : ''}autoplay=1&title=0&byline=0&portrait=0&dnt=1`;

export { projects, people, logos, site };
