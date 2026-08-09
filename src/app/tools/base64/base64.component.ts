import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';
import { downloadBlob, downloadText } from '../../shared/utils/download';

/** Subset of charsets practical in browsers via TextEncoder/TextDecoder + fallbacks */
const CHARSETS = [
  'UTF-8',
  'UTF-16LE',
  'UTF-16BE',
  'ASCII',
  'ISO-8859-1',
  'ISO-8859-2',
  'ISO-8859-15',
  'Windows-1252',
] as const;

type Charset = (typeof CHARSETS)[number] | 'AUTO';

@Component({
  selector: 'app-base64',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  templateUrl: './base64.component.html',
  styleUrl: './base64.component.scss',
})
export class Base64Component {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly charsets = ['AUTO', ...CHARSETS];

  mode: 'encode' | 'decode' = 'decode';
  input = '';
  output = '';
  error = '';
  charset: Charset = 'UTF-8';
  urlSafe = false;
  wrap = true;
  liveMode = true;
  decodeLinesSeparately = false;
  fileName = '';
  fileInfo = '';

  onInput(): void {
    if (this.liveMode) this.run();
  }

  setMode(mode: 'encode' | 'decode'): void {
    if (this.mode === mode) {
      this.run();
      return;
    }
    this.mode = mode;
    this.run();
  }

  run(): void {
    if (this.mode === 'encode') this.encode();
    else this.decode();
  }

  encode(): void {
    this.mode = 'encode';
    this.error = '';
    try {
      if (this.decodeLinesSeparately) {
        this.output = this.input
          .split(/\r?\n/)
          .map((line) => (line.trim() ? this.encodeText(line) : ''))
          .join('\n');
      } else {
        this.output = this.encodeText(this.input);
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Encode failed';
      this.output = '';
    }
  }

  decode(): void {
    this.mode = 'decode';
    this.error = '';
    try {
      if (this.decodeLinesSeparately) {
        this.output = this.input
          .split(/\r?\n/)
          .map((line) => (line.trim() ? this.decodeText(line.trim()) : ''))
          .join('\n');
      } else {
        this.output = this.decodeText(this.input);
      }
    } catch {
      this.error = 'Invalid Base64 input (check padding, charset, or URL-safe mode)';
      this.output = '';
    }
  }

  private encodeText(text: string): string {
    const bytes = this.textToBytes(text, this.charset === 'AUTO' ? 'UTF-8' : this.charset);
    let b64 = this.bytesToBase64(bytes);
    if (this.urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return b64;
  }

  private decodeText(raw: string): string {
    let b64 = raw.replace(/\s+/g, '');
    // strip data-url prefix
    const dataUrl = b64.match(/^data:[^;]+;base64,(.*)$/i);
    if (dataUrl) b64 = dataUrl[1];
    if (this.urlSafe || /[-_]/.test(b64)) {
      b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
    }
    const bytes = this.base64ToBytes(b64);
    const cs = this.charset === 'AUTO' ? this.detectCharset(bytes) : this.charset;
    return this.bytesToText(bytes, cs);
  }

  private textToBytes(text: string, charset: string): Uint8Array {
    if (charset === 'UTF-8' || charset === 'ASCII') {
      return new TextEncoder().encode(text);
    }
    if (charset === 'UTF-16LE') {
      const buf = new Uint8Array(text.length * 2);
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        buf[i * 2] = c & 0xff;
        buf[i * 2 + 1] = c >> 8;
      }
      return buf;
    }
    if (charset === 'UTF-16BE') {
      const buf = new Uint8Array(text.length * 2);
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        buf[i * 2] = c >> 8;
        buf[i * 2 + 1] = c & 0xff;
      }
      return buf;
    }
    // Latin-1 family: map code points 0-255
    if (charset.startsWith('ISO-8859') || charset === 'Windows-1252') {
      const buf = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        buf[i] = c <= 255 ? c : 0x3f;
      }
      return buf;
    }
    return new TextEncoder().encode(text);
  }

  private bytesToText(bytes: Uint8Array, charset: string): string {
    try {
      if (charset === 'UTF-16LE' || charset === 'UTF-16BE') {
        return new TextDecoder(charset === 'UTF-16LE' ? 'utf-16le' : 'utf-16be').decode(bytes);
      }
      if (charset === 'ISO-8859-1' || charset === 'Windows-1252') {
        return new TextDecoder('iso-8859-1').decode(bytes);
      }
      return new TextDecoder(charset === 'ASCII' ? 'utf-8' : 'utf-8', { fatal: false }).decode(bytes);
    } catch {
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    }
  }

  private detectCharset(bytes: Uint8Array): string {
    // BOM checks
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return 'UTF-16LE';
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return 'UTF-16BE';
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'UTF-8';
    // Null-byte heuristic for UTF-16
    let nulls = 0;
    for (let i = 0; i < Math.min(bytes.length, 200); i++) if (bytes[i] === 0) nulls++;
    if (nulls > 10) return 'UTF-16LE';
    return 'UTF-8';
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  private base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  swap(): void {
    [this.input, this.output] = [this.output, this.input];
    this.onInput();
  }

  sample(): void {
    this.mode = 'encode';
    this.input = 'Man is distinguished, not only by his reason, but ...';
    this.encode();
  }

  clear(): void {
    this.input = this.output = this.error = this.fileName = this.fileInfo = '';
  }

  async onEncodeFile(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let b64 = this.bytesToBase64(buf);
      if (this.urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      this.input = `data:${file.type || 'application/octet-stream'};base64,${b64}`;
      this.output = b64;
      this.fileName = file.name;
      this.fileInfo = `${file.name} · ${(file.size / 1024).toFixed(1)} KB → Base64`;
      this.mode = 'encode';
      this.toast.success('File encoded locally');
    } catch {
      this.error = 'Could not read file';
    }
    (ev.target as HTMLInputElement).value = '';
  }

  async onDecodeFile(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      this.input = text.trim();
      this.decode();
      // Also offer binary download of decoded bytes
      const b64 = text.replace(/\s+/g, '').replace(/^data:[^;]+;base64,/i, '');
      let normalized = b64;
      if (this.urlSafe || /[-_]/.test(normalized)) {
        normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4) normalized += '=';
      }
      const bytes = this.base64ToBytes(normalized);
      this.fileName = file.name.replace(/\.(txt|b64|base64)$/i, '') || 'decoded';
      this.fileInfo = `Decoded ${bytes.length} bytes from ${file.name}`;
      this.toast.success('Base64 file decoded');
    } catch {
      this.error = 'Could not decode file';
    }
    (ev.target as HTMLInputElement).value = '';
  }

  downloadDecodedBinary(): void {
    if (!isPlatformBrowser(this.platformId) || !this.input.trim()) return;
    try {
      let b64 = this.input.replace(/\s+/g, '').replace(/^data:[^;]+;base64,/i, '');
      if (this.urlSafe || /[-_]/.test(b64)) {
        b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
      }
      const bytes = this.base64ToBytes(b64);
      downloadBlob(this.fileName || 'decoded.bin', new Blob([bytes]));
      this.toast.success('Download started');
    } catch {
      this.error = 'Cannot download — invalid Base64';
    }
  }

  downloadTextOut(): void {
    if (!this.output) return;
    downloadText(this.mode === 'encode' ? 'encoded.b64.txt' : 'decoded.txt', this.output);
  }
}
