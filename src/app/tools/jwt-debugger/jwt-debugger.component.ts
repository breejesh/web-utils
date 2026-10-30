import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

interface Claim {
  key: string;
  label: string;
  value: string;
  note?: string;
  tone?: 'ok' | 'warn' | 'bad';
}

const TIME_CLAIMS: Record<string, string> = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before', auth_time: 'Authenticated' };
const KNOWN_CLAIMS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  jti: 'Token ID',
  scope: 'Scope',
  azp: 'Authorized party',
};

@Component({
  selector: 'app-jwt-debugger',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, IconComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <button type="button" class="btn btn-quiet btn-sm" (click)="sample()"><svg appIcon="sparkles"></svg> Sample</button>
        <button type="button" class="btn btn-quiet btn-sm" (click)="clear()"><svg appIcon="trash"></svg> Clear</button>
        <span class="spacer"></span>
        @if (status) {
          <span class="chip" [class.chip-accent]="status.tone === 'ok'" [class.chip-warning]="status.tone === 'warn'" [class.chip-danger]="status.tone === 'bad'">
            {{ status.text }}
          </span>
        }
      </div>

      @if (error) {
        <div class="error-box">{{ error }}</div>
      }

      <div class="grid-2 jwt-grid">
        <div class="panel surface">
          <div class="panel-head">
            <h3 class="panel-title">Encoded token</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(token)" [disabled]="!token"><svg appIcon="copy"></svg> Copy</button>
          </div>
          <textarea
            class="textarea token-input"
            [(ngModel)]="token"
            [appToolHistory]="tool.slug"
            historyField="token"
            placeholder="Paste a JWT: eyJhbGciOi…"
            (ngModelChange)="decode()"
            spellcheck="false"></textarea>
          @if (segments.length) {
            <div class="colored mono" aria-label="Token segments">
              @for (seg of segments; track $index; let last = $last) {
                <span [class]="'seg seg-' + $index">{{ seg }}</span>@if (!last) {<span class="dot">.</span>}
              }
            </div>
            <div class="legend">
              <span><i class="sw seg-0"></i>Header</span>
              <span><i class="sw seg-1"></i>Payload</span>
              <span><i class="sw seg-2"></i>Signature</span>
            </div>
          }
          <p class="hint"><svg appIcon="lock" [size]="12" style="display:inline;vertical-align:-1px"></svg> Decoded in your browser. This tool doesn’t save tokens unless you turn on history.</p>
        </div>

        <div class="decoded">
          <div class="panel surface">
            <div class="panel-head">
              <h3 class="panel-title"><i class="sw seg-0"></i>Header</h3>
              <button type="button" class="btn btn-quiet btn-sm btn-icon" (click)="clip.copy(header)" [disabled]="!header" aria-label="Copy header"><svg appIcon="copy"></svg></button>
            </div>
            <pre class="json mono">{{ header || '—' }}</pre>
          </div>
          <div class="panel surface">
            <div class="panel-head">
              <h3 class="panel-title"><i class="sw seg-1"></i>Payload</h3>
              <button type="button" class="btn btn-quiet btn-sm btn-icon" (click)="clip.copy(payload)" [disabled]="!payload" aria-label="Copy payload"><svg appIcon="copy"></svg></button>
            </div>
            <pre class="json mono tall">{{ payload || '—' }}</pre>
          </div>
          @if (claims.length) {
            <div class="panel surface">
              <h3 class="panel-title">Claims</h3>
              <dl class="claims">
                @for (c of claims; track c.key) {
                  <div class="claim">
                    <dt><span class="mono key">{{ c.key }}</span> {{ c.label }}</dt>
                    <dd>
                      <span class="mono">{{ c.value }}</span>
                      @if (c.note) {
                        <span class="note" [class.ok]="c.tone === 'ok'" [class.warn]="c.tone === 'warn'" [class.bad]="c.tone === 'bad'">{{ c.note }}</span>
                      }
                    </dd>
                  </div>
                }
              </dl>
            </div>
          }
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .jwt-grid {
        align-items: start;
      }
      .token-input {
        min-height: 120px;
        word-break: break-all;
      }
      .colored {
        padding: 0.75rem 0.9rem;
        border-radius: var(--radius-sm);
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        font-size: 13px;
        line-height: 1.6;
        word-break: break-all;
        max-height: 260px;
        overflow: auto;
      }
      .seg-0 {
        color: #fb7185;
      }
      .seg-1 {
        color: #c084fc;
      }
      .seg-2 {
        color: #38bdf8;
      }
      .dot {
        color: var(--text-primary);
      }
      .legend {
        display: flex;
        gap: 1rem;
        font-size: 12px;
        color: var(--text-muted);
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .sw {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: currentColor;
      }
      .decoded {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        min-width: 0;
      }
      .json {
        margin: 0;
        padding: 0.75rem 0.9rem;
        border-radius: var(--radius-sm);
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        font-size: 13px;
        line-height: 1.55;
        color: var(--text-primary);
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 220px;
        overflow: auto;
      }
      .json.tall {
        max-height: 360px;
      }
      .claims {
        margin: 0;
        display: flex;
        flex-direction: column;
      }
      .claim {
        display: grid;
        grid-template-columns: minmax(130px, 0.8fr) 1.6fr;
        gap: 0.75rem;
        padding: 0.5rem 0;
        border-top: 1px solid var(--border-color);
        font-size: 13px;
      }
      .claim:first-child {
        border-top: 0;
      }
      dt {
        color: var(--text-muted);
      }
      .key {
        color: var(--text-primary);
        margin-right: 0.25rem;
      }
      dd {
        margin: 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        color: var(--text-primary);
        overflow-wrap: anywhere;
      }
      .note {
        font-size: 12px;
        color: var(--text-muted);
      }
      .note.ok {
        color: var(--accent-color);
      }
      .note.warn {
        color: var(--warning);
      }
      .note.bad {
        color: var(--danger);
      }
    `,
  ],
})
export class JwtDebuggerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  token = '';
  header = '';
  payload = '';
  error = '';
  segments: string[] = [];
  claims: Claim[] = [];
  status: { text: string; tone: 'ok' | 'warn' | 'bad' } | null = null;

  decode(): void {
    this.error = '';
    this.header = this.payload = '';
    this.segments = [];
    this.claims = [];
    this.status = null;
    const raw = this.token.trim().replace(/^Bearer\s+/i, '');
    if (!raw) return;
    const parts = raw.split('.');
    this.segments = parts;
    if (parts.length === 5) {
      this.error = 'This looks like an encrypted JWE (5 segments). Its payload can’t be read without the key.';
      return;
    }
    if (parts.length < 2) {
      this.error = 'A JWT has three dot-separated segments: header.payload.signature';
      return;
    }
    let h: Record<string, unknown>;
    let p: Record<string, unknown>;
    try {
      h = b64urlJson(parts[0]);
    } catch {
      this.error = 'The header segment is not valid Base64URL-encoded JSON';
      return;
    }
    try {
      p = b64urlJson(parts[1]);
    } catch {
      this.header = JSON.stringify(h, null, 2);
      this.error = 'The payload segment is not valid Base64URL-encoded JSON';
      return;
    }
    this.header = JSON.stringify(h, null, 2);
    this.payload = JSON.stringify(p, null, 2);
    this.claims = this.buildClaims(h, p);

    const alg = String(h['alg'] ?? '');
    const now = Date.now() / 1000;
    if (alg.toLowerCase() === 'none') {
      this.status = { text: 'Unsigned (alg: none)', tone: 'bad' };
    } else if (typeof p['exp'] === 'number' && p['exp'] < now) {
      this.status = { text: `Expired ${relative(p['exp'] * 1000)}`, tone: 'bad' };
    } else if (typeof p['nbf'] === 'number' && p['nbf'] > now) {
      this.status = { text: 'Not valid yet', tone: 'warn' };
    } else if (typeof p['exp'] === 'number') {
      this.status = { text: `Valid · expires ${relative(p['exp'] * 1000)}`, tone: 'ok' };
    } else {
      this.status = { text: 'No expiry (exp) claim', tone: 'warn' };
    }
  }

  private buildClaims(h: Record<string, unknown>, p: Record<string, unknown>): Claim[] {
    const out: Claim[] = [];
    if (h['alg'] !== undefined) {
      const alg = String(h['alg']);
      out.push({
        key: 'alg',
        label: 'Algorithm',
        value: alg,
        note: alg.toLowerCase() === 'none' ? 'Unsigned — never accept this server-side' : alg.startsWith('HS') ? 'HMAC shared secret' : 'Asymmetric signature',
        tone: alg.toLowerCase() === 'none' ? 'bad' : undefined,
      });
    }
    if (h['kid'] !== undefined) out.push({ key: 'kid', label: 'Key ID', value: String(h['kid']) });
    const now = Date.now();
    for (const [key, value] of Object.entries(p)) {
      if (TIME_CLAIMS[key] && typeof value === 'number') {
        const ms = value * 1000;
        const past = ms < now;
        out.push({
          key,
          label: TIME_CLAIMS[key],
          value: new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' }),
          note: relative(ms),
          tone: key === 'exp' ? (past ? 'bad' : 'ok') : key === 'nbf' && !past ? 'warn' : undefined,
        });
      } else if (KNOWN_CLAIMS[key]) {
        out.push({ key, label: KNOWN_CLAIMS[key], value: Array.isArray(value) ? value.join(', ') : String(value) });
      }
    }
    return out;
  }

  sample(): void {
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQyIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTQ0MDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.bxcsyljfMora0yaLFxmuyZ2w7nfWxpolDc8sMbakN_U';
    this.decode();
  }

  clear(): void {
    this.token = this.header = this.payload = this.error = '';
    this.segments = [];
    this.claims = [];
    this.status = null;
  }
}

function b64urlJson(seg: string): Record<string, unknown> {
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  const value = JSON.parse(json);
  if (!value || typeof value !== 'object') throw new Error('not an object');
  return value;
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
  const [unit, size] = units.find(([, s]) => abs >= s) ?? ['second', 1000];
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(diff / size), unit);
}
