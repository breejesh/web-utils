import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'web-utils-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<ThemeMode>('dark');

  init(): void {
    const initial = this.resolveInitial();
    this.apply(initial, false);
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.apply(mode);
  }

  private resolveInitial(): ThemeMode {
    if (!this.isBrowser) return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private apply(mode: ThemeMode, persist = true): void {
    this.theme.set(mode);
    const root = this.document.documentElement;
    const body = this.document.body;
    root.classList.toggle('light-theme', mode === 'light');
    body?.classList.toggle('light-theme', mode === 'light');
    root.style.colorScheme = mode;
    if (persist && this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }
}
