import { ToolCategory, ToolDefinition } from '../models/tool.model';

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'encoding',
    name: 'Encoding',
    description: 'Base64, URL encoding, and transfer-safe transforms.',
    order: 1,
  },
  {
    id: 'data',
    name: 'Data formats',
    description: 'JSON, YAML, CSV, SQL, and structured data tools.',
    order: 2,
  },
  {
    id: 'dev',
    name: 'Developer',
    description: 'JWT, regex, cron, certificates, EVTX, and debugging helpers.',
    order: 3,
  },
  {
    id: 'generators',
    name: 'Generators',
    description: 'UUIDs, passwords, lorem, and QR codes.',
    order: 4,
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Diff, case, word count, and markdown.',
    order: 5,
  },
  {
    id: 'time',
    name: 'Date & time',
    description: 'Timestamps, ages, and date math.',
    order: 6,
  },
  {
    id: 'media',
    name: 'Media & color',
    description: 'Images, EXIF, SVG, and color conversion.',
    order: 7,
  },
  {
    id: 'security',
    name: 'Privacy & security',
    description: 'Hashes, passwords, and offline-safe utilities.',
    order: 8,
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'base64-encode-decode',
    name: 'Base64 Encode & Decode',
    shortName: 'Base64',
    description: 'Encode/decode with charset options, live mode, line mode, and file tools.',
    longDescription:
      'Decode and encode Base64 with character-set selection, live mode, per-line processing, URL-safe variant, and file encode/decode downloads — inspired by base64decode.org, fully local.',
    seoTitle: 'Base64 Encode Decode Online — Charsets, Files, Live Mode',
    seoDescription:
      'Free Base64 encode and decode online. Charset support, live mode, line-by-line, URL-safe, and file tools. 100% client-side — no upload.',
    keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'file to base64', 'base64url'],
    category: 'encoding',
    component: 'base64',
    icon: '01',
    featured: true,
    popular: true,
  },
  {
    slug: 'url-encode-decode',
    name: 'URL Encode & Decode',
    shortName: 'URL Encode',
    description: 'Percent-encode and decode URLs and query strings safely.',
    longDescription:
      'Encode special characters for URLs or decode percent-encoded strings. Ideal for query params, redirects, and debugging APIs.',
    seoTitle: 'URL Encode Decode Online — Percent Encoding Tool',
    seoDescription:
      'URL encode and decode online. Free percent-encoding tool for query strings and paths. Fully client-side and private.',
    keywords: ['url encode', 'url decode', 'percent encoding', 'query string encode'],
    category: 'encoding',
    component: 'url-encode',
    icon: '02',
    popular: true,
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    shortName: 'JSON',
    description: 'Beautify, minify, lint, tree-view, auto-fix, upload/download — private JSON toolkit.',
    longDescription:
      'Format and validate JSON with indent levels, tree viewer, auto-fix for common mistakes, localStorage notepad, file upload/download, and print — feature-inspired by jsonformatter.org, 100% client-side.',
    seoTitle: 'JSON Formatter & Validator — Beautify, Lint, Tree View',
    seoDescription:
      'Online JSON formatter, validator, minifier, and tree viewer. Auto-fix, upload/download, local save. Nothing leaves your browser.',
    keywords: ['json formatter', 'json beautify', 'json minify', 'json validator', 'json lint', 'json tree'],
    category: 'data',
    component: 'json-formatter',
    icon: '03',
    featured: true,
    popular: true,
  },
  {
    slug: 'jwt-debugger',
    name: 'JWT Debugger',
    shortName: 'JWT',
    description: 'Decode JWT header and payload without sending tokens to a server.',
    longDescription:
      'Inspect JSON Web Tokens locally. Decode header and payload claims, view expiry, and understand structure — verification stays optional and local.',
    seoTitle: 'JWT Debugger — Decode JWT Online Privately',
    seoDescription:
      'Decode JWT tokens online without uploading. View header, payload, and claims fully in your browser.',
    keywords: ['jwt decoder', 'jwt debugger', 'json web token', 'decode jwt'],
    category: 'dev',
    component: 'jwt-debugger',
    icon: '04',
    featured: true,
    popular: true,
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    shortName: 'UUID',
    description: 'Generate UUID v4 and NanoID-style IDs in bulk.',
    longDescription:
      'Create cryptographically strong UUID v4 identifiers and compact IDs for apps, databases, and testing.',
    seoTitle: 'UUID Generator Online — UUID v4 & Bulk IDs',
    seoDescription:
      'Generate UUID v4 and bulk identifiers online. Free, private, client-side UUID generator.',
    keywords: ['uuid generator', 'uuid v4', 'guid generator', 'nanoid'],
    category: 'generators',
    component: 'uuid-generator',
    icon: '05',
    popular: true,
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    shortName: 'Hash',
    description: 'SHA-1, SHA-256, SHA-512 hashes via Web Crypto — never uploaded.',
    longDescription:
      'Hash text with modern browser cryptography. Useful for checksums, integrity checks, and learning digests.',
    seoTitle: 'Hash Generator Online — SHA-256, SHA-512 (Client-Side)',
    seoDescription:
      'Generate SHA-1, SHA-256, and SHA-512 hashes online. Uses Web Crypto in your browser — private and free.',
    keywords: ['sha256 hash', 'hash generator', 'sha512', 'checksum online'],
    category: 'security',
    component: 'hash-generator',
    icon: '06',
    featured: true,
  },
  {
    slug: 'text-diff',
    name: 'Text Diff',
    shortName: 'Diff',
    description: 'Compare two texts side by side and highlight changes.',
    longDescription:
      'See additions, removals, and unchanged lines between two snippets. Great for configs, copy, and code reviews.',
    seoTitle: 'Text Diff Online — Compare Two Texts Side by Side',
    seoDescription:
      'Free online text diff tool. Compare two strings or code snippets with highlighted changes. Client-side only.',
    keywords: ['text diff', 'compare text', 'diff checker', 'string compare'],
    category: 'text',
    component: 'text-diff',
    icon: '07',
    popular: true,
  },
  {
    slug: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    shortName: 'Epoch',
    description: 'Full epoch converter: live clock, s/ms/µs/ns, date parts, periods, code samples.',
    longDescription:
      'Convert Unix timestamps in seconds, milliseconds, microseconds, and nanoseconds. Live epoch clock, date-part builder, start/end of day/month/year, duration humanizer, and multi-language code examples — inspired by epochconverter.com, fully client-side.',
    seoTitle: 'Unix Epoch Converter — Timestamp to Date Online (s/ms/µs/ns)',
    seoDescription:
      'Free Unix epoch converter with live clock, auto unit detection, date parts, year/month/day ranges, and code samples. Fully private in your browser.',
    keywords: ['unix timestamp', 'epoch converter', 'timestamp to date', 'epoch time', 'unix time'],
    category: 'time',
    component: 'timestamp-converter',
    icon: '08',
    popular: true,
    featured: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    shortName: 'Regex',
    description: 'regex101-style playground: live match, highlight, groups, substitution, and quick reference.',
    longDescription:
      'Build, test, and debug JavaScript regular expressions in the browser — pattern/flags bar, live match highlighting, match information with capture groups, substitution, token explanation, and a quick reference (inspired by regex101.com). Fully client-side.',
    seoTitle: 'Regex Tester Online — Match, Groups, Substitution (like regex101)',
    seoDescription:
      'Free client-side regex tester with live highlighting, capture groups, substitution, explanation, and quick reference. JavaScript flavor, no upload.',
    keywords: [
      'regex tester',
      'regular expression',
      'regex101',
      'regex match',
      'regex groups',
      'regex substitution',
      'regex debugger',
    ],
    category: 'dev',
    component: 'regex-tester',
    icon: '09',
    featured: true,
  },
  {
    slug: 'color-converter',
    name: 'Color Converter',
    shortName: 'Color',
    description: 'Convert HEX, RGB, HSL and check contrast ratios.',
    longDescription:
      'Convert between color formats, preview swatches, and evaluate WCAG contrast for accessible UI work.',
    seoTitle: 'Color Converter — HEX RGB HSL & Contrast Checker',
    seoDescription:
      'Convert HEX, RGB, and HSL colors online. Preview swatches and check contrast. Fully client-side.',
    keywords: ['hex to rgb', 'color converter', 'hsl converter', 'contrast checker'],
    category: 'media',
    component: 'color-converter',
    icon: '10',
  },
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    shortName: 'Units',
    description: 'Convert length, weight, temperature, data size, and more.',
    longDescription:
      'Everyday unit conversion for length, mass, temperature, and digital storage — fast and precise.',
    seoTitle: 'Unit Converter Online — Length, Weight, Temp, Data',
    seoDescription:
      'Free unit converter for length, weight, temperature, and data sizes. Instant client-side conversion.',
    keywords: ['unit converter', 'length converter', 'mb to gb', 'celsius fahrenheit'],
    category: 'data',
    component: 'unit-converter',
    icon: '11',
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    shortName: 'Percent',
    description: 'Tips, discounts, percentage change, and “what percent of”.',
    longDescription:
      'Solve everyday percentage problems: discounts, tips, what percent X is of Y, and percent change.',
    seoTitle: 'Percentage Calculator — Discount, Tip, Change',
    seoDescription:
      'Calculate percentages, discounts, tips, and percent change online. Simple, private, client-side.',
    keywords: ['percentage calculator', 'discount calculator', 'percent of', 'tip calculator'],
    category: 'data',
    component: 'percentage-calculator',
    icon: '12',
  },
  {
    slug: 'word-counter',
    name: 'Word & Character Counter',
    shortName: 'Word Count',
    description: 'Count words, characters, sentences, and reading time.',
    longDescription:
      'Instant stats for writing: words, characters (with/without spaces), sentences, paragraphs, and reading time.',
    seoTitle: 'Word Counter Online — Characters, Sentences, Reading Time',
    seoDescription:
      'Count words and characters online with reading time estimates. Free client-side writing tool.',
    keywords: ['word counter', 'character counter', 'reading time'],
    category: 'text',
    component: 'word-counter',
    icon: '13',
    popular: true,
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    shortName: 'Case',
    description: 'camelCase, snake_case, kebab-case, Title Case, and more.',
    longDescription:
      'Transform text between common programming and writing cases in one click.',
    seoTitle: 'Case Converter — camelCase, snake_case, kebab-case',
    seoDescription:
      'Convert text to camelCase, snake_case, kebab-case, Title Case, and more. Free online case converter.',
    keywords: ['case converter', 'camelcase', 'snake case', 'kebab case'],
    category: 'text',
    component: 'case-converter',
    icon: '14',
  },
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    shortName: 'Lorem',
    description: 'Generate placeholder paragraphs, sentences, or words.',
    longDescription:
      'Fill designs and mockups with classic lorem ipsum. Choose words, sentences, or paragraphs.',
    seoTitle: 'Lorem Ipsum Generator — Placeholder Text Online',
    seoDescription:
      'Generate lorem ipsum placeholder text online. Words, sentences, or paragraphs — free and private.',
    keywords: ['lorem ipsum', 'placeholder text', 'dummy text generator'],
    category: 'generators',
    component: 'lorem-ipsum',
    icon: '15',
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    shortName: 'QR Code',
    description: 'Create QR codes for URLs and text — download as PNG.',
    longDescription:
      'Generate QR codes locally for links, Wi‑Fi notes, or plain text. Download PNG without a server.',
    seoTitle: 'QR Code Generator Online — Free PNG Download',
    seoDescription:
      'Create QR codes online for free. Generate from text or URL and download PNG. Fully client-side.',
    keywords: ['qr code generator', 'create qr code', 'qr to png'],
    category: 'generators',
    component: 'qr-code',
    icon: '16',
    popular: true,
  },
  {
    slug: 'image-tools',
    name: 'Image Tools',
    shortName: 'Image',
    description: 'Image to Base64, resize, and compress in the browser.',
    longDescription:
      'Convert images to Base64, resize dimensions, and compress quality using Canvas — no uploads.',
    seoTitle: 'Image to Base64, Resize & Compress Online',
    seoDescription:
      'Convert image to Base64, resize, and compress online without uploading. Private browser image tools.',
    keywords: ['image to base64', 'resize image', 'compress image online'],
    category: 'media',
    component: 'image-tools',
    icon: '17',
  },
  {
    slug: 'csv-json',
    name: 'CSV ↔ JSON',
    shortName: 'CSV/JSON',
    description: 'Convert CSV tables to JSON arrays and back.',
    longDescription:
      'Transform CSV into JSON objects or flatten JSON arrays into CSV. Handy for data chores and APIs.',
    seoTitle: 'CSV to JSON & JSON to CSV Converter Online',
    seoDescription:
      'Convert CSV to JSON and JSON to CSV online. Free, private, client-side data converter.',
    keywords: ['csv to json', 'json to csv', 'csv converter'],
    category: 'data',
    component: 'csv-json',
    icon: '18',
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    shortName: 'Password',
    description: 'Strong random passwords offline with customizable rules.',
    longDescription:
      'Generate high-entropy passwords with length and character-class controls. Crypto-strong randomness when available.',
    seoTitle: 'Password Generator Online — Strong & Offline',
    seoDescription:
      'Generate strong random passwords offline in your browser. Customize length and character sets. Private by design.',
    keywords: ['password generator', 'strong password', 'random password'],
    category: 'security',
    component: 'password-generator',
    icon: '19',
    featured: true,
  },
  {
    slug: 'date-calculator',
    name: 'Date Calculator',
    shortName: 'Dates',
    description: 'Age, date difference, and add/subtract days.',
    longDescription:
      'Calculate age, days between dates, and future/past dates. Useful for planning and admin tasks.',
    seoTitle: 'Date Calculator — Age, Difference, Add Days',
    seoDescription:
      'Calculate age, date difference, and add or subtract days online. Free client-side date tools.',
    keywords: ['date calculator', 'age calculator', 'days between dates'],
    category: 'time',
    component: 'date-calculator',
    icon: '20',
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Preview',
    shortName: 'Markdown',
    description: 'Live Markdown editor with HTML preview.',
    longDescription:
      'Write Markdown and see a live preview. Export HTML when you need it — all processed locally.',
    seoTitle: 'Markdown Preview Online — Live Editor & HTML',
    seoDescription:
      'Live Markdown preview and HTML export online. Free client-side Markdown editor.',
    keywords: ['markdown preview', 'markdown editor', 'markdown to html'],
    category: 'text',
    component: 'markdown-preview',
    icon: '21',
  },
  {
    slug: 'svg-optimizer',
    name: 'SVG Optimizer',
    shortName: 'SVG',
    description: 'Minify SVG markup by stripping noise and whitespace.',
    longDescription:
      'Clean SVG source for the web: remove comments, excess whitespace, and editor metadata when safe.',
    seoTitle: 'SVG Optimizer & Minifier Online',
    seoDescription:
      'Minify and clean SVG online. Strip comments and whitespace client-side for smaller assets.',
    keywords: ['svg optimizer', 'svg minifier', 'compress svg'],
    category: 'media',
    component: 'svg-optimizer',
    icon: '22',
  },
  {
    slug: 'cron-explainer',
    name: 'Cron Expression Explainer',
    shortName: 'Cron',
    description: 'Translate cron expressions into plain English.',
    longDescription:
      'Paste a cron schedule and get a human-readable description. Includes common examples.',
    seoTitle: 'Cron Expression Explainer — Human Readable Cron',
    seoDescription:
      'Explain cron expressions in plain English. Free online cron parser and examples. Client-side.',
    keywords: ['cron explainer', 'cron expression', 'crontab generator'],
    category: 'dev',
    component: 'cron-explainer',
    icon: '23',
  },
  {
    slug: 'sql-formatter',
    name: 'SQL Formatter',
    shortName: 'SQL',
    description: 'Beautify SQL queries with consistent indentation.',
    longDescription:
      'Format messy SQL for readability. Dialect-aware formatting when possible, fully offline.',
    seoTitle: 'SQL Formatter Online — Beautify SQL Queries',
    seoDescription:
      'Format and beautify SQL online. Free client-side SQL formatter for cleaner queries.',
    keywords: ['sql formatter', 'beautify sql', 'sql pretty print'],
    category: 'data',
    component: 'sql-formatter',
    icon: '24',
  },
  {
    slug: 'yaml-json',
    name: 'YAML ↔ JSON',
    shortName: 'YAML/JSON',
    description: 'Convert YAML to JSON and JSON to YAML safely in-browser.',
    longDescription:
      'Move between YAML and JSON for configs and APIs without installing CLI tools.',
    seoTitle: 'YAML to JSON & JSON to YAML Converter',
    seoDescription:
      'Convert YAML to JSON and JSON to YAML online. Free private converter, no uploads.',
    keywords: ['yaml to json', 'json to yaml', 'yaml converter'],
    category: 'data',
    component: 'yaml-json',
    icon: '25',
  },
  {
    slug: 'certificate-inspector',
    name: 'Certificate Inspector',
    shortName: 'Cert/PEM',
    description: 'Inspect PEM certificates and decode basic fields locally.',
    longDescription:
      'Paste a PEM certificate to view structure notes and decoded text sections. Educational inspection only.',
    seoTitle: 'PEM Certificate Inspector Online',
    seoDescription:
      'Inspect PEM certificates in your browser. Decode structure locally — no upload required.',
    keywords: ['pem inspector', 'certificate decoder', 'x509 online'],
    category: 'dev',
    component: 'certificate-inspector',
    icon: '26',
  },
  {
    slug: 'exif-viewer',
    name: 'EXIF Viewer & Stripper',
    shortName: 'EXIF',
    description: 'View image metadata and export a stripped copy.',
    longDescription:
      'Read EXIF/metadata from photos and download a cleaned image without location and camera tags when possible.',
    seoTitle: 'EXIF Viewer Online — View & Strip Image Metadata',
    seoDescription:
      'View EXIF metadata and strip it from images online. Privacy-friendly, fully client-side.',
    keywords: ['exif viewer', 'remove exif', 'image metadata', 'strip gps'],
    category: 'media',
    component: 'exif-viewer',
    icon: '27',
  },
  {
    slug: 'evtx-viewer',
    name: 'EVTX Viewer',
    shortName: 'EVTX',
    description: 'Open Windows Event Log (.evtx) files entirely in the browser.',
    longDescription:
      'Parse Windows EVTX event logs locally: browse events, filter by Event ID or text, inspect recovered strings, and export JSON/CSV. Ideal for IR and forensics without uploading logs.',
    seoTitle: 'EVTX Viewer Online — Windows Event Log Parser (Client-Side)',
    seoDescription:
      'Open and parse Windows .evtx event logs in your browser. Filter events, inspect details, export JSON/CSV. No upload — fully client-side.',
    keywords: ['evtx viewer', 'windows event log', 'evtx parser', 'event viewer online', 'security log'],
    category: 'dev',
    component: 'evtx-viewer',
    icon: '28',
    featured: true,
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(categoryId: string): ToolDefinition[] {
  return TOOLS.filter((t) => t.category === categoryId);
}

export function getCategory(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((c) => c.id === id);
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) => {
    const hay = [t.name, t.shortName, t.description, t.slug, ...t.keywords].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
