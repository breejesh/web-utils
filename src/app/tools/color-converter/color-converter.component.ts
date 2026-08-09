import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-color-converter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="layout">
        <div class="swatch surface" [style.background]="hex" [attr.aria-label]="'Preview ' + hex"></div>
        <div class="fields">
          <label class="field">
            <span class="field-label">HEX</span>
            <div class="row">
              <input class="input mono" [(ngModel)]="hex" (ngModelChange)="fromHex()" />
              <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(hex)">Copy</button>
            </div>
          </label>
          <label class="field">
            <span class="field-label">RGB</span>
            <div class="row">
              <input class="input mono" [ngModel]="rgbStr" (ngModelChange)="fromRgb($event)" />
              <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(rgbStr)">Copy</button>
            </div>
          </label>
          <label class="field">
            <span class="field-label">HSL</span>
            <div class="row">
              <input class="input mono" [ngModel]="hslStr" (ngModelChange)="fromHsl($event)" />
              <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(hslStr)">Copy</button>
            </div>
          </label>
          <label class="field">
            <span class="field-label">Picker</span>
            <input class="picker" type="color" [ngModel]="hex" (ngModelChange)="hex = $event; fromHex()" />
          </label>
        </div>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">Contrast on white / black</h3></div>
        <div class="stat-grid">
          <div class="stat"><span class="k">vs #FFFFFF</span><span class="v">{{ contrastWhite.toFixed(2) }}:1</span></div>
          <div class="stat"><span class="k">vs #000000</span><span class="v">{{ contrastBlack.toFixed(2) }}:1</span></div>
          <div class="stat"><span class="k">WCAG AA text</span><span class="v" style="font-size:1rem">{{ aaText }}</span></div>
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 1rem;
      }
      .swatch {
        min-height: 160px;
        border-radius: var(--radius-lg);
      }
      .fields {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .row {
        display: flex;
        gap: 0.5rem;
      }
      .picker {
        width: 100%;
        height: 44px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-input);
        padding: 0.25rem;
        cursor: pointer;
      }
      @media (max-width: 640px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .swatch {
          min-height: 100px;
        }
      }
    `,
  ],
})
export class ColorConverterComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  hex = '#64ffda';
  rgbStr = 'rgb(100, 255, 218)';
  hslStr = 'hsl(166, 100%, 70%)';
  error = '';
  contrastWhite = 0;
  contrastBlack = 0;
  aaText = '';

  ngOnInit(): void {
    this.fromHex();
  }

  fromHex(): void {
    this.error = '';
    const rgb = this.parseHex(this.hex);
    if (!rgb) {
      this.error = 'Invalid HEX';
      return;
    }
    this.hex = this.toHex(rgb[0], rgb[1], rgb[2]);
    this.rgbStr = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
    this.hslStr = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
    this.updateContrast(rgb);
  }

  fromRgb(value: string): void {
    this.error = '';
    const m = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) {
      this.error = 'Use rgb(r, g, b)';
      return;
    }
    const r = +m[1],
      g = +m[2],
      b = +m[3];
    this.hex = this.toHex(r, g, b);
    this.fromHex();
  }

  fromHsl(value: string): void {
    this.error = '';
    const m = value.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!m) {
      this.error = 'Use hsl(h, s%, l%)';
      return;
    }
    const rgb = this.hslToRgb(+m[1], +m[2], +m[3]);
    this.hex = this.toHex(rgb[0], rgb[1], rgb[2]);
    this.fromHex();
  }

  private parseHex(h: string): [number, number, number] | null {
    let s = h.trim().replace('#', '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  private toHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return (
      '#' +
      [clamp(r), clamp(g), clamp(b)]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rp = 0,
      gp = 0,
      bp = 0;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    return [Math.round((rp + m) * 255), Math.round((gp + m) * 255), Math.round((bp + m) * 255)];
  }

  private updateContrast(rgb: [number, number, number]): void {
    const L = this.relLuminance(rgb);
    this.contrastWhite = (1.05) / (L + 0.05);
    this.contrastBlack = (L + 0.05) / 0.05;
    const best = Math.max(this.contrastWhite, this.contrastBlack);
    this.aaText = best >= 4.5 ? 'Pass (best surface)' : best >= 3 ? 'Large text only' : 'Fail';
  }

  private relLuminance([r, g, b]: [number, number, number]): number {
    const f = (v: number) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
}
