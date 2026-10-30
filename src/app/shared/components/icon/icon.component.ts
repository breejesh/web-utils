import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, Renderer2, inject } from '@angular/core';
import { ICONS, IconName } from '../../icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Inline Lucide icon. Renders real SVG nodes (works in SSR, no innerHTML).
 *
 * ```html
 * <svg appIcon="search" [size]="16"></svg>
 * ```
 */
@Component({
  selector: 'svg[appIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    xmlns: SVG_NS,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    class: 'icon',
    ngSkipHydration: 'true',
    '[attr.width]': 'size',
    '[attr.height]': 'size',
    '[attr.stroke-width]': 'stroke',
  },
})
export class IconComponent implements OnChanges {
  @Input({ required: true }) appIcon!: IconName;
  @Input() size: number | string = 18;
  @Input() stroke: number | string = 1.75;

  private readonly el = inject<ElementRef<SVGElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  ngOnChanges(): void {
    const host = this.el.nativeElement;
    while (host.firstChild) this.renderer.removeChild(host, host.firstChild);
    const node = ICONS[this.appIcon];
    if (!node) return;
    for (const [tag, attrs] of node) {
      const child = this.renderer.createElement(tag, 'svg');
      for (const [k, v] of Object.entries(attrs)) {
        if (v !== undefined && k !== 'key') this.renderer.setAttribute(child, k, String(v));
      }
      this.renderer.appendChild(host, child);
    }
  }
}
