<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="doc-images/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="doc-images/logo-light.svg">
    <img src="doc-images/logo-dark.svg" width="100" height="100" alt="Web Utils Logo">
  </picture>
</p>

<h1 align="center">Web Utils</h1>
<p align="center"><strong>Privacy-First, Client-Side Utility Suite for Everyday Developer & Life Tasks</strong></p>

<p align="center">
  <strong>A fast, sleek, 100% browser-local tool suite — zero backend, zero uploads.</strong><br>
  Encode, format, convert, analyze, and generate without sending a single byte of your data to external servers.<br>
  Live at <a href="https://utils.breejeshrathod.com/">utils.breejeshrathod.com</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-19.2-DD0031?style=flat-square&logo=angular" alt="Angular 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Architecture-SSR%20%2B%20Prerender-0891B2?style=flat-square" alt="SSR + Prerender">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Client--Side-15803D?style=flat-square" alt="Privacy First">
  <img src="https://img.shields.io/badge/License-MIT-059669?style=flat-square" alt="License">
</p>

---

### Why Web Utils?

Most web utility tools (Base64 decoders, JSON formatters, JWT decoders, regex testers) force users to paste sensitive strings, proprietary logs, API tokens, or personal data into third-party websites. Many of these services silently upload your inputs to backend servers, log payloads, show intrusive advertisements, or require user registration.

**Web Utils is built as the privacy-focused alternative.** It is designed around four core pillars:

- **100% Client-Side & Privacy-First:** All processing, formatting, encoding, and parsing runs entirely in your browser using local JavaScript and the Web Crypto API. Your data, pasted text, and uploaded files **never leave your device**.
- **28+ Essential Developer & Daily Tools:** A comprehensive collection covering Base64, JSON formatting & auto-fix, JWT decoding, Windows EVTX log parsing, Regex playgrounds, Unix timestamps, SQL beautification, Hash generation, and much more.
- **Blazing Fast Angular 19 + SSR Prerendering:** Every tool features its own SEO-optimized, deep-linkable URL (`/tools/{slug}`). Static prerendering delivers instant load times and full search engine indexability.
- **Zero Backend, Zero Logins & Zero Ads:** No user accounts, no tracking of payload content, no server-side APIs, and no ads. Just open the app and instantly complete your task.

### Highlights

- **Paste anything:** drop a JWT, JSON blob, epoch timestamp, Base64, PEM, cron, SQL or color into the home page box. It works out what the input is, shows an instant answer (for example "JWT · alg HS256 · expires in 3 days"), and opens the right tool pre-filled.
- **⌘K / Ctrl+K command palette:** fuzzy, typo-tolerant search across every tool and action. Paste data into it to route straight to the right tool. `/` also opens it.
- **Private share links:** **Share** puts your input in the URL `#fragment`, which browsers never send to servers. Sensitive tools (JWT, hashes, certificates, passwords) leave the input out.
- **Provably local:** a strict `Content-Security-Policy` (`connect-src 'self'`, `img-src 'self' data: blob:`) means the browser itself blocks requests to other origins. A service worker makes every tool work offline, and the app can be installed as a PWA.
- **Secrets aren’t remembered:** local history is opt-in for sensitive tools and can be switched off per tool.

---

### Screenshots & Preview

<p align="center">
  <img src="doc-images/homepage-dark.png" alt="Web Utils Homepage (Dark Theme)" width="100%" />
  <br>
  <em>Web Utils Landing Page (Dark Theme) — Category Navigation, Instant Search, Dark/Light Theme System</em>
</p>

<br>

<p align="center">
  <img src="doc-images/base64-light.png" alt="Base64 Encode & Decode Tool (Light Theme)" width="100%" />
  <br>
  <em>Base64 Encode & Decode Tool (Light Theme) — Charset Options, Live Mode, Per-Line & File Downloads</em>
</p>

<br>

<p align="center">
  <img src="doc-images/regex-dark.png" alt="Regex Tester Tool (Dark Theme)" width="100%" />
  <br>
  <em>Regex Tester & Debugger (Dark Theme) — Interactive Match Highlighting, Capture Groups, Substitution & Reference Guide</em>
</p>

---

### Suite of 28 Tools

Web Utils is organized into 8 intuitive categories:

#### 🔐 Encoding & Security
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **Base64 Encode & Decode** | Encode/decode with charsets, live mode, line-by-line, URL-safe mode & file download. | `/tools/base64-encode-decode` |
| **URL Encode & Decode** | Safely percent-encode or decode query parameters and URLs. | `/tools/url-encode-decode` |
| **Hash Generator** | MD5, SHA-1, SHA-256, SHA-384 and SHA-512 for text or files (drag & drop), with checksum verification. | `/tools/hash-generator` |
| **Password Generator** | Unbiased cryptographic passwords (rejection sampling) with every chosen character class guaranteed, plus an entropy meter. | `/tools/password-generator` |

#### 📊 Data Formats & Conversion
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **JSON Formatter** | Beautify, minify, lint, view as tree, auto-fix errors, upload/download JSON locally. | `/tools/json-formatter` |
| **CSV ↔ JSON** | Convert CSV spreadsheet tables into JSON arrays and back. | `/tools/csv-json` |
| **YAML ↔ JSON** | Transform YAML configs to JSON objects and JSON back to YAML. | `/tools/yaml-json` |
| **SQL Formatter** | Beautify SQL queries with dialect support and customizable indentation. | `/tools/sql-formatter` |
| **Unit Converter** | Instant conversions for length, mass, temperature, and digital data storage sizes. | `/tools/unit-converter` |
| **Percentage Calculator** | Calculate discounts, tips, percentage change, and fractional values. | `/tools/percentage-calculator` |

#### 🛠️ Developer Tools
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **JWT Debugger** | Color-coded segments, decoded header/payload, readable exp/iat/nbf with relative times, and alg:none / expiry warnings. | `/tools/jwt-debugger` |
| **EVTX Viewer** | Open, parse, filter, and export Windows Event Log (`.evtx`) files entirely in-browser. | `/tools/evtx-viewer` |
| **Regex Tester** | Interactive JavaScript regex playground with live highlights, capture groups, and substitution. | `/tools/regex-tester` |
| **Cron Expression Explainer** | Translate cron expressions into plain human-readable English schedules. | `/tools/cron-explainer` |
| **Certificate Inspector** | Full X.509 decoder: subject, issuer, validity countdown, SANs, key type/size, extensions, SHA-256/SHA-1 fingerprints. Works with chains and binary DER files. | `/tools/certificate-inspector` |

#### 📝 Text & Documentation
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **Text Diff** | Side-by-side text comparison with highlighted additions and deletions. | `/tools/text-diff` |
| **Word & Character Counter** | Track words, characters, sentences, paragraphs, and reading time estimates. | `/tools/word-counter` |
| **Case Converter** | Convert text between `camelCase`, `snake_case`, `kebab-case`, `Title Case`, and UPPERCASE. | `/tools/case-converter` |
| **Markdown Preview** | Write Markdown with a live HTML preview and export options. | `/tools/markdown-preview` |

#### ⏳ Date & Time
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **Unix Timestamp Converter** | Live epoch clock, auto unit detection (`s`/`ms`/`µs`/`ns`), date parts, and code samples. | `/tools/timestamp-converter` |
| **Date Calculator** | Calculate age, duration between dates, and add/subtract days from specific dates. | `/tools/date-calculator` |

#### 🎨 Media & Utilities
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **Image Tools** | Convert images to Base64, resize dimensions, and compress quality using HTML Canvas. | `/tools/image-tools` |
| **EXIF Viewer & Stripper** | Inspect photo EXIF metadata and download cleaned copies free of location tags. | `/tools/exif-viewer` |
| **SVG Optimizer** | Minify SVG markup by stripping comments, metadata, and excess whitespace. | `/tools/svg-optimizer` |
| **Color Converter** | Convert HEX, RGB, HSL values and evaluate WCAG contrast ratios. | `/tools/color-converter` |

#### 🎲 Generators
| Tool | Description | URL Path |
| :--- | :--- | :--- |
| **UUID Generator** | Bulk UUID v4, time-ordered UUID v7 (RFC 9562), and compact Nano-style IDs. | `/tools/uuid-generator` |
| **Lorem Ipsum Generator** | Generate placeholder text by word count, sentence count, or paragraph count. | `/tools/lorem-ipsum` |
| **QR Code Generator** | Create customizable QR codes for text/URLs and download high-res PNG images. | `/tools/qr-code-generator` |

---

### Tech Stack & Architecture

- **Framework:** [Angular 19](https://angular.dev/) (standalone components, signals, one lazy chunk per tool)
- **Rendering:** every page prerendered via `@angular/ssr` with per-page meta, social cards and JSON-LD (WebApplication, BreadcrumbList, FAQPage); real `404.html`
- **Offline:** `@angular/service-worker` (installable PWA)
- **Language:** TypeScript 5.7
- **Styling:** SCSS design system with CSS custom-property tokens (light, dark and system themes), self-hosted Geist fonts, and [Lucide](https://lucide.dev) icons
- **Cryptography & Parsing:** Web Crypto API, `marked`, `js-yaml`, `sql-formatter`, `exifr`, `cronstrue`, `diff`, `qrcode`
- **Hosting & Infrastructure:** [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

### Quick Start (Local Development)

#### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

#### Installation & Running

```bash
# Clone the repository
git clone https://github.com/breejesh/web-utils.git
cd web-utils

# Install dependencies
npm install

# Start the Angular development server
npm start
```

Open your browser and navigate to `http://localhost:4200/`.

---

### Build & Deployment

#### Production Build (SSR + Prerender)

```bash
npm run build
```

This compiles:
- Static browser bundle & prerendered HTML routes: `dist/web-utils/browser`
- Node SSR server bundle: `dist/web-utils/server`

To test the SSR production bundle locally:

```bash
npm run serve:ssr:web-utils
```

`npm run build` also runs `scripts/postbuild.mjs`, which promotes the prerendered 404 page to `404.html` and generates `sitemap.xml` (with git-based `lastmod`).

#### Regenerate social cards and icons

After adding or renaming a tool, run this to regenerate `public/og/*.jpg`, the PWA icons and `favicon.ico` (requires a local Chrome; set `CHROME_PATH` if needed):

```bash
npm run images
```

#### Deploy to Firebase Hosting

```bash
# Build and deploy hosting target to Firebase
npm run ship
```

---

### Privacy & Data Guarantee

1. **Zero Payload Transmission:** All inputs, files, logs and generated strings stay inside your browser tab. The CSP in `firebase.json` blocks connections to any other origin, so this is enforced by the browser, not just promised.
2. **Local Storage Only:** History, bookmarks and drafts live in `window.localStorage` only. History is off by default for sensitive tools and can be toggled per tool. Clear everything from the sidebar or the Privacy page.
3. **Telemetry & Analytics:** none is loaded today. `AnalyticsService` supports GA4 page views (path only, never inputs or URL fragments). Enabling it also requires adding the Google domains to the CSP in `firebase.json` and updating the Privacy page.

---

### License & Author

Crafted with ❤️ by **[Breejesh Rathod](https://breejeshrathod.com)**

Distributed under the **MIT License**. See `LICENSE` for more information.
