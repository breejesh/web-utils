import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Page-view analytics only. Never send tool payloads, paste content, or form values.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private initialized = false;

  init(): void {
    if (!this.isBrowser || this.initialized) return;
    const measurementId = environment.firebase.measurementId;
    if (!measurementId) {
      this.initialized = true;
      return;
    }

    // Lightweight gtag bootstrap (Firebase Analytics / GA4 compatible)
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    this.initialized = true;
  }

  pageView(path: string, title?: string): void {
    if (!this.isBrowser || !environment.firebase.measurementId || !window.gtag) return;
    // Never attach query/hash content that might include user data
    const cleanPath = path.split('?')[0].split('#')[0];
    window.gtag('event', 'page_view', {
      page_path: cleanPath,
      page_title: title || document.title,
    });
  }

  toolOpen(slug: string): void {
    if (!this.isBrowser || !environment.firebase.measurementId || !window.gtag) return;
    window.gtag('event', 'tool_open', {
      tool_slug: slug,
    });
  }
}
