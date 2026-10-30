/**
 * "Paste anything" detection: figures out what a string is and which tool should open it.
 * Pure + synchronous so it can run on every keystroke. Order matters: most specific first.
 */

export interface Detection {
  /** Tool slug to open. */
  slug: string;
  /** What we think the input is, e.g. "JSON Web Token". */
  label: string;
  /** One-line instant answer shown before opening the tool. */
  preview?: string;
  /** 0–1. Only the best match is promoted. */
  confidence: number;
}

const MAX_SCAN = 200_000;

export function detectInput(raw: string): Detection[] {
  const text = raw.length > MAX_SCAN ? raw.slice(0, MAX_SCAN) : raw;
  const s = text.trim();
  if (!s) return [];
  const out: Detection[] = [];
  const add = (d: Detection) => out.push(d);

  // JWT
  if (/^eyJ[\w-]*\.eyJ[\w-]*\.[\w-]*$/.test(s)) {
    add({ slug: 'jwt-debugger', label: 'JSON Web Token', preview: jwtPreview(s), confidence: 0.99 });
  }

  // PEM
  if (/-----BEGIN [A-Z0-9 ]+-----/.test(s)) {
    const type = s.match(/-----BEGIN ([A-Z0-9 ]+)-----/)?.[1] ?? 'PEM';
    add({
      slug: 'certificate-inspector',
      label: type.includes('PRIVATE') ? 'Private key — do not paste this anywhere online' : `PEM ${titleCase(type)}`,
      confidence: 0.98,
    });
  }

  // JSON
  if (/^[[{]/.test(s)) {
    try {
      const v = JSON.parse(s);
      const size = Array.isArray(v) ? `${v.length} item array` : `object with ${Object.keys(v ?? {}).length} keys`;
      add({ slug: 'json-formatter', label: 'Valid JSON', preview: size, confidence: 0.97 });
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
        add({ slug: 'csv-json', label: 'JSON array → CSV', confidence: 0.5 });
      }
    } catch (e) {
      add({ slug: 'json-formatter', label: 'JSON (with errors)', preview: shortError(e), confidence: 0.8 });
    }
  }

  // Unix timestamp (s / ms / µs / ns)
  if (/^-?\d{9,19}(\.\d+)?$/.test(s)) {
    const preview = timestampPreview(s);
    if (preview) add({ slug: 'timestamp-converter', label: 'Unix timestamp', preview, confidence: 0.95 });
  }

  // UUID
  const uuid = s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (uuid) {
    add({ slug: 'uuid-generator', label: `UUID v${uuid[1]}`, preview: 'Valid UUID — generate more like it', confidence: 0.9 });
  }

  // Hex digests
  const hexLen: Record<number, string> = { 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 96: 'SHA-384', 128: 'SHA-512' };
  if (/^[0-9a-f]+$/i.test(s) && hexLen[s.length]) {
    add({ slug: 'hash-generator', label: `Looks like a ${hexLen[s.length]} hash`, preview: 'Compare it against text or a file', confidence: 0.8 });
  }

  // Colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) || /^(rgb|hsl)a?\(/i.test(s)) {
    add({ slug: 'color-converter', label: 'Color', preview: s, confidence: 0.95 });
  }

  // Cron (5 or 6 fields of cron tokens)
  if (/^(@(yearly|annually|monthly|weekly|daily|hourly|reboot)|([\d*?/,\-LW#A-Za-z]+\s+){4,5}[\d*?/,\-LW#A-Za-z]+)$/.test(s) && /[*\/]/.test(s) || /^@(yearly|annually|monthly|weekly|daily|hourly)$/.test(s)) {
    add({ slug: 'cron-explainer', label: 'Cron expression', confidence: 0.9 });
  }

  // URL / percent-encoding
  if (/%[0-9a-f]{2}/i.test(s) && !/\s/.test(s)) {
    let preview: string | undefined;
    try {
      preview = truncate(decodeURIComponent(s.replace(/\+/g, ' ')), 90);
    } catch {
      /* malformed */
    }
    add({ slug: 'url-encode-decode', label: 'URL-encoded text', preview, confidence: 0.85 });
  } else if (/^https?:\/\/\S+$/i.test(s)) {
    add({ slug: 'qr-code-generator', label: 'URL', preview: 'Turn it into a QR code', confidence: 0.7 });
    add({ slug: 'url-encode-decode', label: 'URL', preview: 'Encode it for a query string', confidence: 0.6 });
  }

  // Base64 (after JWT/hex so those win)
  const compact = s.replace(/\s+/g, '');
  if (
    compact.length >= 8 &&
    /^[A-Za-z0-9+/_-]+={0,2}$/.test(compact) &&
    !/^\d+$/.test(compact) &&
    !out.some((d) => d.confidence >= 0.9)
  ) {
    const decoded = tryBase64(compact);
    if (decoded !== null) {
      add({ slug: 'base64-encode-decode', label: 'Base64', preview: truncate(decoded, 90), confidence: 0.88 });
    }
  }
  if (/^data:[\w/+.-]+;base64,/.test(s)) {
    add({ slug: 'base64-encode-decode', label: 'Base64 data URL', confidence: 0.9 });
  }

  // SVG
  if (/^(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(s)) {
    add({ slug: 'svg-optimizer', label: 'SVG markup', preview: `${(s.length / 1024).toFixed(1)} KB — minify it`, confidence: 0.95 });
  }

  // SQL
  if (/^\s*(select|insert|update|delete|create|alter|drop|with)\b[\s\S]*\b(from|into|set|table|as|values|where)\b/i.test(s)) {
    add({ slug: 'sql-formatter', label: 'SQL query', confidence: 0.88 });
  }

  // YAML (multi-line key: value, not JSON)
  const lines = s.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  if (
    !/^[[{]/.test(s) &&
    lines.length >= 2 &&
    lines.filter((l) => /^\s*(- )?[\w.-]+:(\s|$)/.test(l) || /^\s*- /.test(l)).length / lines.length > 0.7
  ) {
    add({ slug: 'yaml-json', label: 'YAML', confidence: 0.8 });
  }

  // CSV
  if (lines.length >= 2 && !out.some((d) => d.confidence >= 0.85)) {
    for (const delim of [',', '\t', ';']) {
      const counts = lines.slice(0, 20).map((l) => l.split(delim).length - 1);
      if (counts[0] >= 1 && counts.every((c) => c === counts[0])) {
        add({ slug: 'csv-json', label: delim === '\t' ? 'TSV table' : 'CSV table', preview: `${lines.length} rows × ${counts[0] + 1} columns`, confidence: 0.8 });
        break;
      }
    }
  }

  // Markdown
  if (/^#{1,6}\s|\n#{1,6}\s|\*\*[^*]+\*\*|^\s*[-*]\s.+\n\s*[-*]\s|```|\[[^\]]+\]\([^)]+\)/m.test(s)) {
    add({ slug: 'markdown-preview', label: 'Markdown', confidence: 0.6 });
  }

  // Identifier → case converter
  if (/^[A-Za-z][A-Za-z0-9]*([_-][A-Za-z0-9]+)+$|^[a-z]+([A-Z][a-z0-9]+)+$/.test(s)) {
    add({ slug: 'case-converter', label: 'Identifier', preview: 'Convert between camelCase, snake_case, kebab-case…', confidence: 0.75 });
  }

  // Plain text fallbacks
  if (!out.length || out.every((d) => d.confidence < 0.7)) {
    const words = s.split(/\s+/).filter(Boolean).length;
    add({ slug: 'word-counter', label: 'Text', preview: `${words} word${words === 1 ? '' : 's'}, ${s.length} characters`, confidence: 0.5 });
    add({ slug: 'case-converter', label: 'Text', preview: 'Change case', confidence: 0.4 });
    add({ slug: 'hash-generator', label: 'Text', preview: 'Hash it (SHA-256, MD5…)', confidence: 0.35 });
    add({ slug: 'base64-encode-decode', label: 'Text', preview: 'Encode as Base64', confidence: 0.3 });
  }

  // De-duplicate by slug keeping the highest confidence, then sort.
  const best = new Map<string, Detection>();
  for (const d of out) {
    const prev = best.get(d.slug);
    if (!prev || prev.confidence < d.confidence) best.set(d.slug, d);
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

function jwtPreview(token: string): string | undefined {
  try {
    const [h, p] = token.split('.').slice(0, 2).map(decodeB64UrlJson);
    const parts: string[] = [];
    if (h?.['alg']) parts.push(`alg ${h['alg']}`);
    if (typeof p?.['sub'] === 'string' || typeof p?.['sub'] === 'number') parts.push(`sub ${p['sub']}`);
    if (typeof p?.['exp'] === 'number') {
      const ms = p['exp'] * 1000;
      parts.push(ms < Date.now() ? `expired ${relative(ms)}` : `expires ${relative(ms)}`);
    }
    return parts.join(' · ') || undefined;
  } catch {
    return undefined;
  }
}

function decodeB64UrlJson(seg: string): Record<string, unknown> {
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(seg.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function timestampPreview(s: string): string | undefined {
  const digits = s.replace(/^-/, '').split('.')[0].length;
  const n = Number(s);
  const ms = digits <= 11 ? n * 1000 : digits <= 14 ? n : digits <= 17 ? n / 1e3 : n / 1e6;
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  if (Number.isNaN(d.getTime()) || year < 1971 || year > 2200) return undefined;
  const unit = digits <= 11 ? 's' : digits <= 14 ? 'ms' : digits <= 17 ? 'µs' : 'ns';
  return `${d.toISOString().replace('.000Z', 'Z')} (${unit}) · ${relative(ms)}`;
}

function tryBase64(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    if (b64.replace(/=+$/, '').length % 4 === 1) return null;
    const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Mostly printable → it was really text.
    const printable = text.replace(/[^\x20-\x7e\n\r\t -￿]/g, '').length;
    if (!text.length || printable / text.length < 0.9) return null;
    return text;
  } catch {
    return null;
  }
}

function relative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1000],
  ];
  const [unit, size] = units.find(([, size]) => abs >= size) ?? ['second', 1000];
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(diff / size), unit);
}

function shortError(e: unknown): string {
  return truncate(e instanceof Error ? e.message : 'Invalid JSON', 90);
}

function truncate(s: string, n: number): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** True when the input looks like data to identify rather than a tool-name search. */
export function looksLikeData(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  return (
    s.length > 24 ||
    /\n/.test(s) ||
    /[{}[\]<>=%]/.test(s) ||
    /^-?\d{9,}$/.test(s) ||
    /^eyJ/.test(s) ||
    /^#[0-9a-f]{3,8}$/i.test(s) ||
    /^(rgb|hsl)a?\(/i.test(s) ||
    /^[\d*/,-]+(\s+[\d*/,?LW#A-Za-z-]+){4,5}$/.test(s) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)
  );
}
