import { isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, IconComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="panel surface hero">
        <div class="pw-row">
          <output class="pw mono" aria-live="polite">{{ password || '—' }}</output>
          <button type="button" class="btn btn-ghost btn-icon" (click)="generate()" aria-label="Generate a new password" title="Generate new">
            <svg appIcon="sparkles"></svg>
          </button>
          <button type="button" class="btn btn-primary" (click)="clip.copy(password)" [disabled]="!password">
            <svg appIcon="copy"></svg> Copy
          </button>
        </div>
        <div class="meter" [attr.data-level]="strength" aria-hidden="true"><span [style.width.%]="meterPct"></span></div>
        <div class="meta-row">
          <span
            class="chip"
            [class.chip-accent]="strength === 'Strong' || strength === 'Excellent'"
            [class.chip-warning]="strength === 'Good'"
            [class.chip-danger]="strength === 'Weak'"
            >{{ strength }}</span
          >
          <span>~{{ entropy }} bits of entropy</span>
          <span>Never saved or sent anywhere</span>
        </div>
      </div>
      @if (error) {
        <div class="error-box">{{ error }}</div>
      }
      <div class="options surface">
        <label class="field len">
          <span class="field-label">Length: <strong class="mono">{{ length }}</strong></span>
          <input type="range" min="4" max="128" [(ngModel)]="length" (ngModelChange)="generate()" />
        </label>
        <label class="check"><input type="checkbox" [(ngModel)]="lower" (ngModelChange)="generate()" /> a–z</label>
        <label class="check"><input type="checkbox" [(ngModel)]="upper" (ngModelChange)="generate()" /> A–Z</label>
        <label class="check"><input type="checkbox" [(ngModel)]="digits" (ngModelChange)="generate()" /> 0–9</label>
        <label class="check"><input type="checkbox" [(ngModel)]="symbols" (ngModelChange)="generate()" /> Symbols</label>
        <label class="check">
          <input type="checkbox" [(ngModel)]="excludeAmbiguous" (ngModelChange)="generate()" /> Exclude look-alikes (0/O, 1/l/I)
        </label>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .hero {
        padding: 1.1rem 1.1rem 1rem;
        gap: 0.85rem;
      }
      .pw-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .pw {
        flex: 1;
        min-width: 0;
        font-size: clamp(1.1rem, 2.4vw, 1.6rem);
        color: var(--text-primary);
        letter-spacing: 0.03em;
        overflow-wrap: anywhere;
        line-height: 1.35;
      }
      .meter {
        height: 4px;
        border-radius: 999px;
        background: var(--bg-active);
        overflow: hidden;
      }
      .meter span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--accent-color);
        transition:
          width 0.3s var(--ease),
          background 0.3s var(--ease);
      }
      .meter[data-level='Weak'] span {
        background: var(--danger);
      }
      .meter[data-level='Good'] span {
        background: var(--warning);
      }
      .len {
        flex: 1 1 260px;
        min-width: 220px;
      }
      .len input {
        width: 100%;
      }
      .len strong {
        color: var(--text-primary);
      }
    `,
  ],
})
export class PasswordGeneratorComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  length = 20;
  lower = true;
  upper = true;
  digits = true;
  symbols = true;
  excludeAmbiguous = true;
  password = '';
  error = '';
  strength = '—';
  entropy = 0;

  get meterPct(): number {
    return Math.min(100, Math.round((this.entropy / 128) * 100));
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.generate();
    }
  }

  generate(): void {
    this.error = '';
    const sets: string[] = [];
    if (this.lower) sets.push(this.excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz');
    if (this.upper) sets.push(this.excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (this.digits) sets.push(this.excludeAmbiguous ? '23456789' : '0123456789');
    if (this.symbols) sets.push(this.excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()-_=+[]{};:,.?');
    if (!sets.length) {
      this.error = 'Select at least one character set';
      this.password = '';
      this.strength = '—';
      this.entropy = 0;
      return;
    }
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
      this.error = 'Secure randomness (Web Crypto) is unavailable in this browser';
      return;
    }
    const pool = sets.join('');
    const len = Math.min(128, Math.max(Math.max(4, sets.length), Math.floor(Number(this.length)) || 20));
    // One guaranteed character from each selected set, the rest from the full pool, then shuffle.
    const chars = sets.map((set) => set[randomInt(set.length)]);
    while (chars.length < len) chars.push(pool[randomInt(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    this.password = chars.join('');
    this.entropy = Math.floor(len * Math.log2(pool.length));
    this.strength = this.entropy < 50 ? 'Weak' : this.entropy < 80 ? 'Good' : this.entropy < 120 ? 'Strong' : 'Excellent';
  }
}

/** Uniform integer in [0, max) via rejection sampling (no modulo bias). */
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}
