import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="nf">
      <p class="mono code">404</p>
      <h1>Page not found</h1>
      <p>That URL doesn’t match a tool or page on Web Utils.</p>
      <a routerLink="/" class="btn btn-primary">Browse tools</a>
    </section>
  `,
  styles: [
    `
      .nf {
        text-align: center;
        padding: 3rem 1rem;
      }
      .code {
        color: var(--accent-color);
        font-size: 0.95rem;
        margin: 0;
      }
      h1 {
        color: var(--text-primary);
        margin: 0.5rem 0;
      }
      .btn {
        margin-top: 1rem;
        display: inline-flex;
      }
    `,
  ],
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  ngOnInit(): void {
    this.seo.setNotFound();
  }
}
