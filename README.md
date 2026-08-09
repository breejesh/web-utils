# Web Utils

Privacy-first, fully **client-side** utility suite for everyday developer and life tasks.

- **Product name:** Web Utils  
- **Domain:** [utils.breejeshrathod.com](https://utils.breejeshrathod.com)  
- **Stack:** Angular 19 · SSR + prerender · SCSS design system aligned with breejesh-portfolio  
- **Promise:** Tool payloads never leave the browser  

## Features

- 27 tools with dedicated SEO URLs (`/tools/{slug}`)
- Dark / light themes (portfolio tokens: near-black + mint accent)
- Sticky shell, searchable sidebar, responsive layout
- Prerendered pages for crawlable HTML
- Firebase Analytics hook (page views + tool_open only — no paste content)
- `robots.txt`, `sitemap.xml`, canonical + Open Graph tags per page

## Quick start

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Build (SSR + prerender)

```bash
npm run build
```

Output:

- Browser assets: `dist/web-utils/browser`
- Server bundle: `dist/web-utils/server`

Serve SSR locally:

```bash
npm run serve:ssr:web-utils
```

## Configure analytics

Edit production Firebase / GA values in:

- `src/environments/environment.prod.ts`

Set `firebase.measurementId` (e.g. `G-XXXXXXXX`) to enable gtag page views. Leave empty to keep analytics off.

## Build & ship (Firebase)

Firebase project: **`utils-breejeshrathod`**  
`ng build` already includes SSR + prerender (all tool pages).

```bash
npm run build   # production build + prerender → dist/web-utils/browser
npm run ship    # build, then deploy hosting to utils-breejeshrathod
```

One-time auth: `npx firebase-tools login`  
Custom domain: attach **utils.breejeshrathod.com** in the Firebase console.

## Tool URL map (sample)

| Tool | Path |
|------|------|
| Base64 | `/tools/base64-encode-decode` |
| JSON Formatter | `/tools/json-formatter` |
| JWT Debugger | `/tools/jwt-debugger` |
| Hash Generator | `/tools/hash-generator` |
| … | see `src/app/core/data/tools.registry.ts` |

## Privacy

See `/privacy`. Inputs stay local. Analytics (if enabled) track routes only.
