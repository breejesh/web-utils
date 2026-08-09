import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="inner">
        <p class="mono left">
          {{ siteName }} · client-side only ·
          <a routerLink="/privacy">Privacy</a>
        </p>
        <p class="right">
          Crafted by
          <a [href]="portfolioUrl" target="_blank" rel="noopener noreferrer">Breejesh Rathod</a>
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        border-top: 1px solid var(--border-color);
        background: var(--bg-secondary);
        margin-top: auto;
      }
      .inner {
        max-width: 1600px;
        margin: 0 auto;
        padding: 1rem 1.25rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.5rem;
        justify-content: space-between;
        align-items: center;
        color: var(--text-muted);
        font-size: 13px;
      }
      .left,
      .right {
        margin: 0;
      }
      a {
        color: var(--accent-color);
      }
    `,
  ],
})
export class FooterComponent {
  readonly siteName = environment.siteName;
  readonly portfolioUrl = environment.portfolioUrl;
}
