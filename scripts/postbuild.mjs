// Runs after `ng build`:
//  1. Promotes the prerendered /404 page to /404.html so static hosting serves real 404s (no soft-404s).
//  2. Generates sitemap.xml from the prerendered routes, with per-page lastmod taken from git history.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://utils.breejeshrathod.com';
const DIST = 'dist/web-utils';
const BROWSER = join(DIST, 'browser');

// 1. 404 page
const notFound = join(BROWSER, '404', 'index.html');
if (!existsSync(notFound)) throw new Error('Prerendered /404 page is missing');
copyFileSync(notFound, join(BROWSER, '404.html'));
rmSync(join(BROWSER, '404'), { recursive: true, force: true });

// 2. Sitemap
const registry = readFileSync('src/app/core/data/tools.registry.ts', 'utf8');
const componentBySlug = Object.fromEntries(
  [...registry.matchAll(/slug: '([^']+)'[\s\S]*?component: '([^']+)'/g)].map((m) => [m[1], m[2]])
);

function lastModified(paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], { encoding: 'utf8' }).trim();
    return out ? out.slice(0, 10) : today();
  } catch {
    return today();
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const shared = ['src/app/shared/components/tool-layout', 'src/app/core/data/tools.content.ts', 'src/styles'];
const { routes } = JSON.parse(readFileSync(join(DIST, 'prerendered-routes.json'), 'utf8'));
const urls = Object.keys(routes)
  .filter((r) => r !== '/404')
  .map((route) => {
    const slug = route.startsWith('/tools/') ? route.slice('/tools/'.length) : null;
    const component = slug ? componentBySlug[slug] : null;
    const sources = component
      ? [`src/app/tools/${component}`, ...shared]
      : route === '/'
        ? ['src/app/pages/home', 'src/app/core/data', 'src/styles']
        : [`src/app/pages${route}`];
    return {
      loc: `${SITE}${route === '/' ? '/' : route}`,
      lastmod: lastModified(sources),
      priority: route === '/' ? '1.0' : slug ? '0.8' : '0.3',
    };
  })
  .sort((a, b) => Number(b.priority) - Number(a.priority) || a.loc.localeCompare(b.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(BROWSER, 'sitemap.xml'), xml);
console.log(`postbuild: 404.html + sitemap.xml (${urls.length} URLs)`);
