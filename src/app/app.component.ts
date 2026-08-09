import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './core/services/analytics.service';
import { ThemeService } from './core/services/theme.service';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent],
  template: `
    <router-outlet />
    <app-toast-host />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.theme.init();
    this.analytics.init();

    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      // Tool pages track themselves with richer titles; home/privacy still get page_view here.
      if (!e.urlAfterRedirects.startsWith('/tools/')) {
        this.analytics.pageView(e.urlAfterRedirects);
      }
    });
  }
}
