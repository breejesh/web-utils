import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';
import { SeoService } from '../../core/services/seo.service';
import { UserStorageService } from '../../core/services/user-storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <article class="privacy">
      <p class="eyebrow">Privacy</p>
      <h1>Your data never leaves this browser.</h1>
      <p class="lead">
        {{ siteName }} has no backend that receives your data. Every tool runs as JavaScript inside this tab, so
        tokens, logs, files and passwords are processed on your device and nowhere else.
      </p>

      <div class="cards">
        <section class="card surface">
          <svg appIcon="shield-check" [size]="20"></svg>
          <h2>Enforced, not promised</h2>
          <p>
            The site sends a strict <span class="mono">Content-Security-Policy</span> with
            <span class="mono">connect-src 'self'</span>, so the browser blocks scripts on these pages from sending
            requests to any other origin. You can see it in the response headers in DevTools.
          </p>
        </section>
        <section class="card surface">
          <svg appIcon="wifi-off" [size]="20"></svg>
          <h2>Works offline</h2>
          <p>
            A service worker caches the app after your first visit. Turn off your network and every tool keeps
            working, which is the clearest proof that nothing depends on a server.
          </p>
        </section>
        <section class="card surface">
          <svg appIcon="lock" [size]="20"></svg>
          <h2>Secrets aren’t remembered</h2>
          <p>
            Tools that usually handle secrets (JWT, hashes, certificates, passwords) never save inputs unless you
            switch history on. Share links leave those inputs out too.
          </p>
        </section>
      </div>

      <section class="block">
        <h2>What stays on your device</h2>
        <p>
          Stored in this browser’s <span class="mono">localStorage</span> only, and never synced or uploaded:
        </p>
        <ul>
          <li>Theme preference, bookmarked tools and recently opened tools.</li>
          <li>
            Recent inputs for non-sensitive tools, so you can restore them from <strong>History</strong>. You can
            switch this off for any tool.
          </li>
        </ul>
        <button type="button" class="btn btn-danger" (click)="clearAll()">
          <svg appIcon="trash"></svg> Clear all local data now
        </button>
      </section>

      <section class="block">
        <h2>Share links</h2>
        <p>
          When you share a tool with your input, the input is stored after the <span class="mono">#</span> in the
          URL. Browsers never send that part to a server, so only the person you send the link to can see it. It is
          removed from the address bar as soon as the page opens.
        </p>
      </section>

      <section class="block">
        <h2>Analytics</h2>
        <p>
          No analytics or tracking scripts are loaded at the moment. If page-view analytics are ever added, they
          will record only the page path. They will never include tool inputs, files or URL fragments, and this
          page will be updated first.
        </p>
      </section>

      <section class="block">
        <h2>Hosting</h2>
        <p>
          Static files are served by Firebase Hosting (Google), which, like any web host, may keep standard
          request logs such as IP address and user agent for security purposes. Those logs never include anything
          you type or open in a tool.
        </p>
      </section>

      <section class="block">
        <h2>Verify it yourself</h2>
        <p>
          The full source is on <a [href]="repoUrl" target="_blank" rel="noopener">GitHub</a>. Questions? Reach out
          via <a [href]="portfolioUrl" target="_blank" rel="noopener">breejeshrathod.com</a>.
        </p>
        <a routerLink="/" class="btn btn-primary"><svg appIcon="arrow-right"></svg> Back to the tools</a>
      </section>
    </article>
  `,
  styles: [
    `
      .privacy {
        max-width: 820px;
        margin: 0 auto;
        padding-top: clamp(0.5rem, 3vw, 2rem);
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        color: var(--accent-color);
        font-weight: 600;
        font-size: 13px;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 4.5vw, 2.9rem);
        letter-spacing: -0.04em;
      }
      .lead {
        font-size: 1.08rem;
        line-height: 1.65;
        margin: 1rem 0 0;
        max-width: 62ch;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
        margin: 2rem 0 1rem;
      }
      .card {
        padding: 1.1rem 1.15rem;
      }
      .card .icon {
        color: var(--accent-color);
      }
      .card h2 {
        margin: 0.75rem 0 0.4rem;
        font-size: 1rem;
      }
      .card p {
        margin: 0;
        font-size: 13.5px;
      }
      .block {
        padding: 1.5rem 0;
        border-top: 1px solid var(--border-color);
      }
      .block h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      .block p {
        margin: 0 0 0.5rem;
        max-width: 68ch;
      }
      ul {
        margin: 0 0 1rem;
        padding-left: 1.15rem;
      }
      li + li {
        margin-top: 0.3rem;
      }
      strong {
        color: var(--text-primary);
      }
      .btn {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly storage = inject(UserStorageService);
  private readonly toast = inject(ToastService);
  readonly siteName = environment.siteName;
  readonly portfolioUrl = environment.portfolioUrl;
  readonly repoUrl = environment.repoUrl;

  ngOnInit(): void {
    this.seo.setPrivacy();
  }

  clearAll(): void {
    this.storage.clearAllLocalData();
    this.toast.success('All local data cleared');
  }
}
