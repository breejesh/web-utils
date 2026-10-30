import { Component, Input } from '@angular/core';

/** Logo mark: a terminal prompt in a soft tile. Mirrors public/favicon.svg. */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" class="tile" />
      <path d="M10 11.5 14.5 16 10 20.5" class="glyph" />
      <path d="M17.5 20.5H22.5" class="glyph" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .tile {
        fill: var(--bg-raised);
        stroke: var(--border-strong);
      }
      .glyph {
        stroke: var(--accent-color);
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    `,
  ],
})
export class BrandMarkComponent {
  @Input() size = 28;
}
