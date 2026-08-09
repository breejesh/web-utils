/**
 * Browser-side Windows EVTX (Event Log) parser.
 * Extracts file/chunk headers and event records with FILETIME timestamps.
 * Binary XML is decoded best-effort into readable text/XML-ish strings.
 */

export interface EvtxEvent {
  recordId: number;
  timestamp: Date | null;
  timestampIso: string;
  size: number;
  eventId: string;
  level: string;
  provider: string;
  channel: string;
  computer: string;
  messagePreview: string;
  rawStrings: string[];
  hexPreview: string;
}

export interface EvtxParseResult {
  fileSize: number;
  chunkCount: number;
  dirty: boolean;
  majorVersion: number;
  minorVersion: number;
  events: EvtxEvent[];
  warnings: string[];
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function readU64(view: DataView, offset: number): bigint {
  const lo = BigInt(view.getUint32(offset, true));
  const hi = BigInt(view.getUint32(offset + 4, true));
  return lo + (hi << 32n);
}

function readAscii(bytes: Uint8Array, offset: number, len: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + len));
}

function filetimeToDate(ft: bigint): Date | null {
  if (ft <= 0n) return null;
  // 100-ns intervals since 1601-01-01 → ms since 1970-01-01
  const ms = Number(ft / 10000n - 11644473600000n);
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractUtf16Strings(data: Uint8Array, minLen = 3): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < data.length - 1) {
    // Prefer null-terminated UTF-16LE runs
    if (data[i] >= 32 && data[i] < 127 && data[i + 1] === 0) {
      let s = '';
      let j = i;
      while (j < data.length - 1 && data[j + 1] === 0 && data[j] !== 0) {
        const c = data[j];
        if (c >= 32 && c < 127) s += String.fromCharCode(c);
        else if (c === 9 || c === 10 || c === 13) s += ' ';
        else break;
        j += 2;
      }
      if (s.length >= minLen) {
        out.push(s);
        i = j + 2;
        continue;
      }
    }
    i++;
  }
  // Deduplicate while preserving order
  return [...new Set(out)];
}

function guessField(strings: string[], patterns: RegExp[]): string {
  for (const p of patterns) {
    for (const s of strings) {
      if (p.test(s)) return s;
    }
  }
  return '';
}

function extractEventId(strings: string[], data: Uint8Array): string {
  // Common: "EventID" nearby numeric
  for (let i = 0; i < strings.length; i++) {
    if (/^EventID$/i.test(strings[i]) && strings[i + 1] && /^\d+$/.test(strings[i + 1])) {
      return strings[i + 1];
    }
  }
  // Heuristic: short pure numbers that look like event ids
  const nums = strings.filter((s) => /^\d{1,5}$/.test(s));
  if (nums.length) return nums[0];
  // Fallback scan for little-endian u16 after EventID token in raw
  return '';
}

function toHexPreview(data: Uint8Array, max = 64): string {
  const slice = data.subarray(0, max);
  return [...slice].map((b) => b.toString(16).padStart(2, '0')).join(' ') + (data.length > max ? ' …' : '');
}

export function parseEvtx(buffer: ArrayBuffer, options?: { maxEvents?: number }): EvtxParseResult {
  const maxEvents = options?.maxEvents ?? 5000;
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const warnings: string[] = [];

  if (bytes.length < 4096) {
    throw new Error('File too small to be a valid EVTX log');
  }

  const sig = readAscii(bytes, 0, 8);
  if (sig !== 'ElfFile\0') {
    throw new Error(`Invalid EVTX signature (expected ElfFile, got "${sig.replace(/\0/g, '')}")`);
  }

  const firstChunkNumber = Number(readU64(view, 8));
  const lastChunkNumber = Number(readU64(view, 16));
  const nextRecordId = Number(readU64(view, 24));
  const headerSize = readU32(view, 32);
  const minorVersion = view.getUint16(36, true);
  const majorVersion = view.getUint16(38, true);
  const headerBlockSize = readU32(view, 40);
  let chunkCount = readU32(view, 44);
  const flags = readU32(view, 48);
  const dirty = (flags & 1) !== 0;

  if (chunkCount === 0) {
    // Dirty / incomplete header — estimate from file size
    chunkCount = Math.max(0, Math.floor((bytes.length - 4096) / 65536));
    warnings.push('Chunk count was 0; estimated from file size.');
  }

  const events: EvtxEvent[] = [];
  const headerOffset = headerBlockSize || 4096;

  for (let c = 0; c < chunkCount && events.length < maxEvents; c++) {
    const chunkOff = headerOffset + c * 65536;
    if (chunkOff + 512 > bytes.length) {
      warnings.push(`Chunk ${c} past end of file — stopped.`);
      break;
    }
    const chunkSig = readAscii(bytes, chunkOff, 8);
    if (chunkSig !== 'ElfChnk\0') {
      warnings.push(`Chunk ${c} missing ElfChnk signature — skipped.`);
      continue;
    }

    const lastEventOffset = readU32(view, chunkOff + 44);
    let pos = chunkOff + 512;
    const chunkEnd = Math.min(chunkOff + 65536, bytes.length);
    const limit = lastEventOffset > 0 ? Math.min(chunkOff + lastEventOffset + 65536, chunkEnd) : chunkEnd;

    while (pos + 24 < limit && events.length < maxEvents) {
      // Record signature **\0\0
      if (bytes[pos] !== 0x2a || bytes[pos + 1] !== 0x2a || bytes[pos + 2] !== 0 || bytes[pos + 3] !== 0) {
        pos++;
        continue;
      }

      const size = readU32(view, pos + 4);
      if (size < 28 || size > 65536 || pos + size > bytes.length) {
        pos += 4;
        continue;
      }

      // size is also mirrored at end of record
      const recordId = Number(readU64(view, pos + 8));
      const ft = readU64(view, pos + 16);
      const ts = filetimeToDate(ft);
      const payload = bytes.subarray(pos + 24, pos + size - 4);
      const strings = extractUtf16Strings(payload);

      const eventId = extractEventId(strings, payload);
      const provider =
        guessField(strings, [/^Microsoft-Windows-/i, /^Application$/i, /^Service Control Manager$/i]) ||
        strings.find((s) => s.includes('/') || s.includes('-')) ||
        strings[0] ||
        '';
      const channel =
        guessField(strings, [/^Security$/i, /^System$/i, /^Application$/i, /^Setup$/i, /^ForwardedEvents$/i]) || '';
      const computer = strings.find((s) => /^[A-Za-z0-9._-]{2,63}$/.test(s) && !/Event|System|Data|Time/i.test(s)) || '';
      const level =
        guessField(strings, [/^Information$/i, /^Warning$/i, /^Error$/i, /^Critical$/i, /^Verbose$/i]) || '';

      const messagePreview = strings
        .filter((s) => s.length > 8 && !/^(Event|System|Data|TimeCreated|Provider|Channel|Computer|Level|Task|Opcode|Keywords)$/i.test(s))
        .slice(0, 6)
        .join(' · ')
        .slice(0, 280);

      events.push({
        recordId,
        timestamp: ts,
        timestampIso: ts ? ts.toISOString() : '',
        size,
        eventId,
        level,
        provider,
        channel,
        computer,
        messagePreview,
        rawStrings: strings.slice(0, 80),
        hexPreview: toHexPreview(payload),
      });

      pos += size;
    }
  }

  if (!events.length) {
    warnings.push('No event records were recovered. The file may be truncated, corrupted, or use an unsupported variant.');
  }

  return {
    fileSize: bytes.length,
    chunkCount,
    dirty,
    majorVersion,
    minorVersion,
    events,
    warnings,
  };
}
