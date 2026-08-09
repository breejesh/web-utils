import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="privacy">
      <p class="eyebrow mono">Legal</p>
      <h1>Privacy</h1>
      <p class="lead">
        {{ siteName }} is built so your day-to-day data stays on your device. Tool inputs, files, tokens, and
        passwords are processed in your browser and are not uploaded to our servers.
      </p>

      <section class="surface block">
        <h2>What never leaves your browser</h2>
        <ul>
          <li>Text you paste into tools (Base64, JSON, JWT, SQL, etc.)</li>
          <li>Files you open for image, EXIF, or encoding tools</li>
          <li>Generated passwords, hashes, and QR contents</li>
          <li>Any intermediate results shown on screen</li>
        </ul>
      </section>

      <section class="surface block">
        <h2>What we may collect</h2>
        <ul>
          <li>
            <strong>Page analytics only</strong> (when configured): path, title, approximate region, and device
            type via Firebase Analytics / GA4.
          </li>
          <li>We do <strong>not</strong> send tool payloads, form fields, or file contents to analytics.</li>
          <li>
            On your device only, we may store in <span class="mono">localStorage</span>: theme preference,
            bookmarked tools, recently opened tools, and a short history of values you typed/pasted into tools
            (so you can restore them later). This never leaves your browser.
          </li>
          <li>
            You can clear bookmarks, recent tools, and history anytime via
            <strong>Clear local data</strong> in the sidebar, or per-tool history on each tool page.
          </li>
        </ul>
      </section>

      <section class="surface block">
        <h2>Third parties</h2>
        <p>
          If analytics measurement IDs are configured for production, Google Analytics / Firebase may process
          standard page-view events. You can block this with browser extensions or OS-level tracking protection.
        </p>
      </section>

      <section class="surface block">
        <h2>Contact</h2>
        <p>
          Questions about this site:
          <a [href]="portfolioUrl" target="_blank" rel="noopener noreferrer">breejeshrathod.com</a>
        </p>
        <a routerLink="/" class="btn btn-primary">Back to tools</a>
      </section>
    </article>
  `,
  styles: [
    `
      .privacy {
        max-width: 720px;
      }
      .eyebrow {
        color: var(--accent-color);
        margin: 0 0 0.5rem;
      }
      h1 {
        margin: 0;
        color: var(--text-primary);
        font-size: clamp(1.8rem, 3vw, 2.4rem);
      }
      .lead {
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 1.05rem;
      }
      .block {
        padding: 1.15rem 1.25rem;
        margin-top: 1rem;
      }
      h2 {
        margin: 0 0 0.65rem;
        color: var(--text-primary);
        font-size: 1.1rem;
      }
      ul {
        margin: 0;
        padding-left: 1.15rem;
        color: var(--text-secondary);
        line-height: 1.55;
      }
      p {
        color: var(--text-secondary);
        line-height: 1.55;
      }
      .btn {
        margin-top: 0.85rem;
        display: inline-flex;
      }
    `,
  ],
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);
  readonly siteName = environment.siteName;
  readonly portfolioUrl = environment.portfolioUrl;

  ngOnInit(): void {
    this.seo.setPrivacy();
  }
}
