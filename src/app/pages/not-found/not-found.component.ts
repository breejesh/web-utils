import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOOLS } from '../../core/data/tools.registry';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { SeoService } from '../../core/services/seo.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="nf">
      <p class="code mono">404</p>
      <h1>This page doesn’t exist</h1>
      <p class="sub">The link may be mistyped, or the tool may have moved. These are popular:</p>
      <div class="popular">
        @for (t of popular; track t.slug) {
          <a class="pill" [routerLink]="['/tools', t.slug]"><svg [appIcon]="t.icon" [size]="14"></svg>{{ t.shortName }}</a>
        }
      </div>
      <div class="actions">
        <a routerLink="/" class="btn btn-primary"><svg appIcon="sparkles"></svg> Browse all tools</a>
        <button type="button" class="btn btn-ghost" (click)="palette.open()"><svg appIcon="search"></svg> Search</button>
      </div>
    </section>
  `,
  styles: [
    `
      .nf {
        text-align: center;
        padding: clamp(2rem, 8vw, 5rem) 1rem;
        max-width: 560px;
        margin: 0 auto;
      }
      .code {
        display: inline-block;
        margin: 0;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        color: var(--accent-color);
        background: var(--accent-opacity);
        font-size: 13px;
      }
      h1 {
        margin: 1rem 0 0.5rem;
        font-size: clamp(1.75rem, 4vw, 2.4rem);
        letter-spacing: -0.035em;
      }
      .sub {
        margin: 0;
      }
      .popular {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.4rem;
        margin: 1.25rem 0 1.75rem;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        height: 30px;
        padding: 0 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        background: var(--bg-elevated);
        color: var(--text-primary);
        font-size: 13px;
      }
      .pill:hover {
        border-color: var(--border-strong);
        color: var(--text-primary);
      }
      .actions {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  readonly palette = inject(CommandPaletteService);
  readonly popular = TOOLS.filter((t) => t.popular).slice(0, 8);

  ngOnInit(): void {
    this.seo.setNotFound();
  }
}
