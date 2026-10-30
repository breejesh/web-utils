import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';
import { md5Hex } from '../../shared/utils/md5';

type Algo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const ALGOS: Algo[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

@Component({
  selector: 'app-hash-generator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, IconComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <div class="segmented" role="radiogroup" aria-label="Input source">
          <button type="button" class="seg-btn" role="radio" [class.active]="source === 'text'" [attr.aria-checked]="source === 'text'" (click)="useText()">Text</button>
          <button type="button" class="seg-btn" role="radio" [class.active]="source === 'file'" [attr.aria-checked]="source === 'file'" (click)="source = 'file'">File</button>
        </div>
        <label class="check"><input type="checkbox" [(ngModel)]="uppercase" /> Uppercase</label>
        <span class="spacer"></span>
        <button type="button" class="btn btn-quiet btn-sm" (click)="sample()"><svg appIcon="sparkles"></svg> Sample</button>
        <button type="button" class="btn btn-quiet btn-sm" (click)="clear()"><svg appIcon="trash"></svg> Clear</button>
      </div>

      @if (error) {
        <div class="error-box">{{ error }}</div>
      }

      @if (source === 'text') {
        <div class="panel surface">
          <div class="panel-head">
            <h3 class="panel-title">Text</h3>
            <span class="meta-row">{{ byteCount }} bytes (UTF-8)</span>
          </div>
          <textarea
            class="textarea"
            [(ngModel)]="input"
            [appToolHistory]="tool.slug"
            rows="6"
            placeholder="Type or paste text to hash…"
            (ngModelChange)="hashText()"
            spellcheck="false"></textarea>
        </div>
      } @else {
        <label
          class="drop surface"
          [class.over]="dragOver"
          (dragover)="$event.preventDefault(); dragOver = true"
          (dragleave)="dragOver = false"
          (drop)="onDrop($event)">
          <input type="file" hidden (change)="onFile($event)" />
          <svg appIcon="arrow-up" [size]="22"></svg>
          @if (fileLabel) {
            <span class="drop-title">{{ fileLabel }}</span>
            <span class="drop-sub">Drop another file or click to choose</span>
          } @else {
            <span class="drop-title">Drop a file here, or click to choose</span>
            <span class="drop-sub">Read locally. Even multi-GB downloads never leave your device.</span>
          }
        </label>
      }

      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Digests</h3>
          @if (busy) {
            <span class="meta-row">Hashing…</span>
          }
        </div>
        <div class="digests">
          @for (a of algos; track a) {
            <div class="digest" [class.match]="matchAlgo === a">
              <span class="algo mono">{{ a }}</span>
              <code class="value mono">{{ display(a) || '—' }}</code>
              @if (matchAlgo === a) {
                <span class="chip chip-accent"><svg appIcon="check"></svg> Match</span>
              }
              <button type="button" class="btn btn-quiet btn-sm btn-icon" (click)="clip.copy(display(a))" [disabled]="!results[a]" [attr.aria-label]="'Copy ' + a">
                <svg appIcon="copy"></svg>
              </button>
            </div>
          }
        </div>
        <label class="field compare">
          <span class="field-label">Compare with an expected checksum</span>
          <input class="input mono" [(ngModel)]="expected" placeholder="Paste a published checksum to verify…" spellcheck="false" />
        </label>
        @if (expected.trim()) {
          @if (matchAlgo) {
            <p class="verdict ok"><svg appIcon="shield-check" [size]="16"></svg> Checksum matches ({{ matchAlgo }}).</p>
          } @else if (hasResults) {
            <p class="verdict bad"><svg appIcon="x" [size]="16"></svg> No algorithm matches this checksum.</p>
          }
        }
        <p class="hint">MD5 and SHA-1 are fine for checksums but broken for security. Use SHA-256 or stronger.</p>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .digests {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .digest {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.55rem 0.5rem 0.55rem 0.8rem;
        background: var(--bg-input);
        transition: background var(--transition);
      }
      .digest + .digest {
        border-top: 1px solid var(--border-color);
      }
      .digest.match {
        background: var(--accent-opacity);
      }
      .algo {
        width: 64px;
        flex-shrink: 0;
        font-size: 12px;
        color: var(--text-muted);
      }
      .value {
        flex: 1;
        min-width: 0;
        font-size: 12.5px;
        color: var(--text-primary);
        overflow-wrap: anywhere;
      }
      .compare {
        margin-top: 0.4rem;
      }
      .verdict {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin: 0;
        font-weight: 550;
        font-size: 13.5px;
      }
      .verdict.ok {
        color: var(--accent-color);
      }
      .verdict.bad {
        color: var(--danger);
      }
      .drop {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        min-height: 170px;
        padding: 1.5rem;
        border-style: dashed;
        border-width: 1.5px;
        cursor: pointer;
        text-align: center;
        color: var(--text-muted);
        transition:
          border-color var(--transition),
          background var(--transition);
      }
      .drop:hover,
      .drop.over {
        border-color: var(--accent-color);
        background: var(--accent-opacity);
        color: var(--accent-color);
      }
      .drop-title {
        color: var(--text-primary);
        font-weight: 550;
        overflow-wrap: anywhere;
      }
      .drop-sub {
        font-size: 13px;
      }
    `,
  ],
})
export class HashGeneratorComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  readonly algos = ALGOS;

  source: 'text' | 'file' = 'text';
  input = '';
  expected = '';
  uppercase = false;
  results: Partial<Record<Algo, string>> = {};
  error = '';
  busy = false;
  dragOver = false;
  fileLabel = '';
  byteCount = 0;

  /** Guards against slow async digests resolving after newer input. */
  private seq = 0;

  get hasResults(): boolean {
    return !!this.results['SHA-256'];
  }

  get matchAlgo(): Algo | null {
    const want = this.expected.trim().toLowerCase().replace(/^(md5|sha-?\d+)[:=\s]+/i, '').replace(/\s+/g, '');
    if (!want) return null;
    return ALGOS.find((a) => this.results[a] === want) ?? null;
  }

  display(a: Algo): string {
    const v = this.results[a] ?? '';
    return this.uppercase ? v.toUpperCase() : v;
  }

  hashText(): void {
    const bytes = new TextEncoder().encode(this.input);
    this.byteCount = bytes.length;
    if (!this.input) {
      this.seq++;
      this.results = {};
      return;
    }
    void this.digestAll(bytes);
  }

  useText(): void {
    this.source = 'text';
    this.fileLabel = '';
    this.hashText();
  }

  onFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) void this.hashFile(file);
    (ev.target as HTMLInputElement).value = '';
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver = false;
    const file = ev.dataTransfer?.files?.[0];
    if (file) void this.hashFile(file);
  }

  sample(): void {
    this.source = 'text';
    this.input = 'The quick brown fox jumps over the lazy dog';
    this.expected = '';
    this.hashText();
  }

  clear(): void {
    this.seq++;
    this.input = this.expected = this.error = this.fileLabel = '';
    this.results = {};
    this.byteCount = 0;
  }

  private async hashFile(file: File): Promise<void> {
    this.fileLabel = `${file.name} · ${formatBytes(file.size)}`;
    try {
      await this.digestAll(new Uint8Array(await file.arrayBuffer()));
    } catch {
      this.error = 'Could not read that file';
    }
  }

  private async digestAll(bytes: Uint8Array): Promise<void> {
    const seq = ++this.seq;
    this.error = '';
    if (!globalThis.crypto?.subtle) {
      this.error = 'Web Crypto is not available here (it requires HTTPS or localhost)';
      return;
    }
    this.busy = true;
    try {
      const out: Partial<Record<Algo, string>> = { MD5: md5Hex(bytes) };
      for (const a of ALGOS.slice(1)) {
        out[a] = toHex(await crypto.subtle.digest(a, bytes));
      }
      if (seq === this.seq) this.results = out;
    } catch (e) {
      if (seq === this.seq) this.error = e instanceof Error ? e.message : 'Hash failed';
    } finally {
      if (seq === this.seq) this.busy = false;
    }
  }
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
