import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TOOLS, TOOL_CATEGORIES } from '../../core/data/tools.registry';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, BrandMarkComponent],
  template: `
    <footer class="footer">
      <div class="inner">
        <div class="about">
          <a routerLink="/" class="brand"><app-brand-mark [size]="24" /> {{ siteName }}</a>
          <p>
            Free, open-source developer tools that run entirely in your browser. No uploads, no accounts, no ads,
            and they work offline.
          </p>
          <p class="links">
            <a routerLink="/privacy">Privacy</a>
            <a [href]="repoUrl" target="_blank" rel="noopener">GitHub</a>
            <a [href]="portfolioUrl" target="_blank" rel="noopener">Built by Breejesh Rathod</a>
          </p>
        </div>
        <nav class="cols" aria-label="All tools">
          @for (col of columns; track col.name) {
            <div class="col">
              <h2>{{ col.name }}</h2>
              <ul>
                @for (t of col.tools; track t.slug) {
                  <li><a [routerLink]="['/tools', t.slug]">{{ t.name }}</a></li>
                }
              </ul>
            </div>
          }
        </nav>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        border-top: 1px solid var(--border-color);
        margin-top: 2rem;
      }
      .inner {
        max-width: var(--content-max);
        margin: 0 auto;
        padding: 2.5rem clamp(1rem, 2.5vw, 2rem) 3rem;
        display: grid;
        grid-template-columns: minmax(220px, 300px) 1fr;
        gap: 2.5rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        color: var(--text-primary);
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .about p {
        margin: 0.8rem 0 0;
        font-size: 13.5px;
        color: var(--text-muted);
        max-width: 34ch;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1rem;
      }
      .links a,
      .col a {
        color: var(--text-muted);
        font-size: 13px;
      }
      .links a:hover,
      .col a:hover {
        color: var(--text-primary);
      }
      .cols {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1.75rem 1.5rem;
      }
      h2 {
        margin: 0 0 0.6rem;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 0;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      @media (max-width: 760px) {
        .inner {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class FooterComponent {
  readonly siteName = environment.siteName;
  readonly portfolioUrl = environment.portfolioUrl;
  readonly repoUrl = environment.repoUrl;
  readonly columns = [...TOOL_CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ name: c.name, tools: TOOLS.filter((t) => t.category === c.id) }))
    .filter((c) => c.tools.length);
}
