// Generates social cards (public/og/*.png), PWA icons (public/icons/*) and favicon.ico.
// Re-run after adding or renaming tools:  npm run images
// Needs a local Chrome/Chromium; set CHROME_PATH if it is not in the default location.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve('.');
const OUT_OG = join(ROOT, 'public', 'og');
const OUT_ICONS = join(ROOT, 'public', 'icons');
mkdirSync(OUT_OG, { recursive: true });
mkdirSync(OUT_ICONS, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ||
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => existsSync(p));
if (!CHROME) throw new Error('Chrome not found. Set CHROME_PATH.');

// ── Data from the registry (regex keeps this script dependency-free) ──
const registry = readFileSync('src/app/core/data/tools.registry.ts', 'utf8');
const tools = [...registry.matchAll(/\{\s*slug: '([^']+)',\s*name: '([^']+)',[\s\S]*?description:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?category: '([^']+)'[\s\S]*?icon: '([^']+)'/g)].map(
  (m) => ({ slug: m[1], name: m[2], description: m[3].replace(/\\'/g, "'"), category: m[4], icon: m[5] })
);
const categories = Object.fromEntries(
  [...registry.matchAll(/id: '([^']+)',\s*name: '([^']+)'/g)].map((m) => [m[1], m[2]])
);
if (tools.length < 20) throw new Error(`Only parsed ${tools.length} tools — registry format changed?`);

const ICON_ALIASES = { fingerprint: 'fingerprint-pattern' };
async function iconSvg(name, size, stroke = 1.75) {
  const file = join(ROOT, 'node_modules/lucide/dist/esm/icons', `${ICON_ALIASES[name] ?? name}.mjs`);
  const node = (await import(pathToFileURL(file).href)).default;
  const children = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

// Inline as data URLs: pages rendered via setContent cannot load file:// fonts.
const font = (pkg, file) =>
  'data:font/woff2;base64,' + readFileSync(join(ROOT, 'node_modules/@fontsource-variable', pkg, 'files', file)).toString('base64');
const FONTS = `
  @font-face { font-family: Geist; src: url(${font('geist', 'geist-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
  @font-face { font-family: GeistMono; src: url(${font('geist-mono', 'geist-mono-latin-wght-normal.woff2')}) format('woff2'); font-weight: 100 900; }
`;

const MARK = (size) => `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
    <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#18181b" stroke="#2f2f36"/>
    <path d="M10 11.5 14.5 16 10 20.5M17.5 20.5H22.5" stroke="#64ffda" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

function card({ eyebrow, title, description, icon, url }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${FONTS}
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; background: #08080a; color: #f4f4f5; font-family: Geist, sans-serif; }
    .bg { position: absolute; inset: 0;
      background:
        radial-gradient(600px 400px at 85% 20%, rgba(100,255,218,0.16), transparent 70%),
        radial-gradient(500px 360px at 10% 110%, rgba(125,211,252,0.10), transparent 70%); }
    .grid { position: absolute; inset: 0; opacity: .35;
      background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
      background-size: 48px 48px; mask-image: radial-gradient(ellipse at 70% 30%, #000 20%, transparent 75%); }
    .wrap { position: relative; height: 100%; padding: 64px 72px; display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 650; letter-spacing: -0.02em; }
    .main { flex: 1; display: flex; align-items: center; gap: 48px; }
    .text { flex: 1; min-width: 0; }
    .eyebrow { display: inline-flex; align-items: center; gap: 10px; font-size: 20px; color: #a1a1aa; font-weight: 500; margin-bottom: 22px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #64ffda; box-shadow: 0 0 0 5px rgba(100,255,218,.15); }
    .accent { background: linear-gradient(100deg, #64ffda 10%, #7dd3fc 95%); -webkit-background-clip: text; color: transparent; }
    h1 { font-size: ${title.replace(/<[^>]+>/g, '').length > 26 ? 68 : 80}px; line-height: 1.02; letter-spacing: -0.045em; font-weight: 700; }
    p { margin-top: 22px; font-size: 27px; line-height: 1.4; color: #a1a1aa; max-width: 720px; }
    .tile { width: 220px; height: 220px; border-radius: 48px; flex-shrink: 0; display: grid; place-items: center; color: #64ffda;
      background: radial-gradient(120% 120% at 0% 0%, rgba(100,255,218,.22), transparent 60%), #131316;
      border: 1.5px solid rgba(100,255,218,.28); box-shadow: 0 30px 80px -20px rgba(100,255,218,.35), inset 0 1px 0 rgba(255,255,255,.06); }
    .foot { display: flex; align-items: center; justify-content: space-between; font-size: 21px; color: #71717a; }
    .badges { display: flex; gap: 12px; }
    .badge { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); color: #d4d4d8; }
    .badge.accent { color: #64ffda; border-color: rgba(100,255,218,.3); background: rgba(100,255,218,.08); }
    .url { font-family: GeistMono, monospace; font-size: 19px; }
  </style></head><body>
    <div class="bg"></div><div class="grid"></div>
    <div class="wrap">
      <div class="brand">${MARK(44)} Web Utils</div>
      <div class="main">
        <div class="text">
          <div class="eyebrow"><span class="dot"></span>${eyebrow}</div>
          <h1>${title}</h1>
          <p>${description}</p>
        </div>
        ${icon ? `<div class="tile">${icon}</div>` : ''}
      </div>
      <div class="foot">
        <div class="badges"><span class="badge accent">Runs in your browser</span><span class="badge">No uploads</span><span class="badge">Works offline</span></div>
        <span class="url">${url}</span>
      </div>
    </div>
  </body></html>`;
}

function iconPage(size, { maskable = false } = {}) {
  const pad = maskable ? size * 0.2 : 0;
  const inner = size - pad * 2;
  return `<!doctype html><html><head><style>*{margin:0}body{width:${size}px;height:${size}px;background:${maskable ? '#08080a' : 'transparent'};display:grid;place-items:center}</style></head>
  <body><div style="width:${inner}px;height:${inner}px">${MARK(inner)}</div></body></html>`;
}

/** Minimal ICO container with embedded PNGs. */
function buildIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();

async function render(html, width, height, path, transparent = false) {
  const jpeg = !!path && path.endsWith('.jpg');
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return page.screenshot({
    path,
    type: jpeg ? 'jpeg' : 'png',
    ...(jpeg ? { quality: 88 } : { omitBackground: transparent }),
    clip: { x: 0, y: 0, width, height },
  });
}

await render(
  card({
    eyebrow: `${tools.length} free tools · 0 bytes uploaded`,
    title: 'Developer tools that <span class="accent">never leave your browser.</span>',
    description: 'JSON, Base64, JWT, regex, epoch, hashes and more — private, instant, offline.',
    icon: '',
    url: 'utils.breejeshrathod.com',
  }),
  1200,
  630,
  join(OUT_OG, 'home.jpg')
);

for (const t of tools) {
  await render(
    card({
      eyebrow: categories[t.category] ?? 'Developer tools',
      title: t.name.replace('&', '&amp;'),
      description: t.description.replace('&', '&amp;'),
      icon: await iconSvg(t.icon, 120, 1.5),
      url: `utils.breejeshrathod.com/tools/${t.slug}`,
    }),
    1200,
    630,
    join(OUT_OG, `${t.slug}.jpg`)
  );
}

for (const size of [192, 512]) await render(iconPage(size), size, size, join(OUT_ICONS, `icon-${size}.png`), true);
await render(iconPage(512, { maskable: true }), 512, 512, join(OUT_ICONS, 'icon-maskable-512.png'));
await render(iconPage(180, { maskable: true }), 180, 180, join(OUT_ICONS, 'apple-touch-icon.png'));

const icoPngs = [];
for (const size of [16, 32, 48]) icoPngs.push({ size, data: Buffer.from(await render(iconPage(size), size, size, undefined, true)) });
writeFileSync(join(ROOT, 'public', 'favicon.ico'), buildIco(icoPngs));

await browser.close();
console.log(`Generated ${tools.length + 1} social cards, PWA icons and favicon.ico`);
