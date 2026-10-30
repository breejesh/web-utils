import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

/** Keep in sync with the inline pre-paint script in index.html. */
const STORAGE_KEY = 'web-utils-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private media?: MediaQueryList;

  /** Resolved theme currently applied. */
  readonly theme = signal<ThemeMode>('dark');
  /** What the user chose (system follows the OS). */
  readonly preference = signal<ThemePreference>('system');

  init(): void {
    if (!this.isBrowser) return;
    this.media = window.matchMedia('(prefers-color-scheme: light)');
    this.media.addEventListener('change', () => {
      if (this.preference() === 'system') this.apply();
    });
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked */
    }
    this.preference.set(stored === 'dark' || stored === 'light' ? stored : 'system');
    this.apply();
  }

  /** Cycles dark → light → system. */
  cycle(): void {
    const order: ThemePreference[] = ['dark', 'light', 'system'];
    this.set(order[(order.indexOf(this.preference()) + 1) % order.length]);
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(pref: ThemePreference): void {
    this.preference.set(pref);
    if (this.isBrowser) {
      try {
        if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        /* storage blocked */
      }
    }
    this.apply();
  }

  private apply(): void {
    const pref = this.preference();
    const mode: ThemeMode = pref === 'system' ? (this.media?.matches ? 'light' : 'dark') : pref;
    this.theme.set(mode);
    const root = this.document.documentElement;
    root.classList.toggle('light-theme', mode === 'light');
    root.style.colorScheme = mode;
    const meta = this.document.querySelector('meta[name="theme-color"]:not([media])');
    meta?.setAttribute('content', mode === 'light' ? '#fafafa' : '#08080a');
  }
}
