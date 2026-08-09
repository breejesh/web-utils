import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

const KEYS = {
  bookmarks: 'web-utils:bookmarks',
  recent: 'web-utils:recent-tools',
  history: 'web-utils:tool-history',
} as const;

const MAX_RECENT = 12;
const MAX_HISTORY_PER_TOOL = 20;
const MAX_HISTORY_VALUE_LEN = 50_000;

export interface RecentToolEntry {
  slug: string;
  at: number;
}

export interface HistoryEntry {
  id: string;
  value: string;
  field: string;
  at: number;
  preview: string;
}

export interface RestoreRequest {
  slug: string;
  field: string;
  value: string;
  nonce: number;
}

type HistoryStore = Record<string, HistoryEntry[]>;

@Injectable({ providedIn: 'root' })
export class UserStorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly bookmarksSig = signal<string[]>(this.loadJson(KEYS.bookmarks, [] as string[]));
  private readonly recentSig = signal<RecentToolEntry[]>(this.loadJson(KEYS.recent, [] as RecentToolEntry[]));
  private readonly historySig = signal<HistoryStore>(this.loadJson(KEYS.history, {} as HistoryStore));

  /** Tools subscribe to restore pastes into their fields. */
  readonly restoreRequest = signal<RestoreRequest | null>(null);

  readonly bookmarks = this.bookmarksSig.asReadonly();
  readonly recentTools = this.recentSig.asReadonly();
  readonly bookmarkCount = computed(() => this.bookmarksSig().length);

  isBookmarked(slug: string): boolean {
    return this.bookmarksSig().includes(slug);
  }

  toggleBookmark(slug: string): boolean {
    const set = new Set(this.bookmarksSig());
    let on: boolean;
    if (set.has(slug)) {
      set.delete(slug);
      on = false;
    } else {
      set.add(slug);
      on = true;
    }
    const next = [...set];
    this.bookmarksSig.set(next);
    this.save(KEYS.bookmarks, next);
    return on;
  }

  touchRecent(slug: string): void {
    const now = Date.now();
    const next = [{ slug, at: now }, ...this.recentSig().filter((e) => e.slug !== slug)].slice(0, MAX_RECENT);
    this.recentSig.set(next);
    this.save(KEYS.recent, next);
  }

  historyFor(slug: string, field = 'input'): HistoryEntry[] {
    const all = this.historySig()[slug] || [];
    return all.filter((e) => e.field === field);
  }

  allHistoryFor(slug: string): HistoryEntry[] {
    return this.historySig()[slug] || [];
  }

  /**
   * Save a pasted/typed value. Skips tiny or duplicate consecutive entries.
   */
  pushHistory(slug: string, value: string, field = 'input'): void {
    const trimmed = value ?? '';
    if (!this.isBrowser) return;
    if (trimmed.trim().length < 2) return;
    const clipped =
      trimmed.length > MAX_HISTORY_VALUE_LEN ? trimmed.slice(0, MAX_HISTORY_VALUE_LEN) : trimmed;

    const store = { ...this.historySig() };
    const list = [...(store[slug] || [])];
    const last = list[0];
    if (last && last.field === field && last.value === clipped) return;

    const entry: HistoryEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      value: clipped,
      field,
      at: Date.now(),
      preview: this.makePreview(clipped),
    };
    store[slug] = [entry, ...list.filter((e) => !(e.field === field && e.value === clipped))].slice(
      0,
      MAX_HISTORY_PER_TOOL
    );
    this.historySig.set(store);
    this.save(KEYS.history, store);
  }

  removeHistoryEntry(slug: string, id: string): void {
    const store = { ...this.historySig() };
    store[slug] = (store[slug] || []).filter((e) => e.id !== id);
    if (!store[slug].length) delete store[slug];
    this.historySig.set(store);
    this.save(KEYS.history, store);
  }

  clearHistory(slug?: string): void {
    if (slug) {
      const store = { ...this.historySig() };
      delete store[slug];
      this.historySig.set(store);
      this.save(KEYS.history, store);
      return;
    }
    this.historySig.set({});
    this.save(KEYS.history, {});
  }

  clearBookmarks(): void {
    this.bookmarksSig.set([]);
    this.save(KEYS.bookmarks, []);
  }

  clearRecent(): void {
    this.recentSig.set([]);
    this.save(KEYS.recent, []);
  }

  clearAllLocalData(): void {
    this.clearBookmarks();
    this.clearRecent();
    this.clearHistory();
  }

  requestRestore(slug: string, value: string, field = 'input'): void {
    this.restoreRequest.set({ slug, field, value, nonce: Date.now() });
  }

  private makePreview(value: string): string {
    const oneLine = value.replace(/\s+/g, ' ').trim();
    return oneLine.length > 72 ? oneLine.slice(0, 72) + '…' : oneLine;
  }

  private loadJson<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private save(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded — drop oldest history once
      if (key === KEYS.history) {
        try {
          const store = value as HistoryStore;
          for (const slug of Object.keys(store)) {
            store[slug] = (store[slug] || []).slice(0, 5);
          }
          localStorage.setItem(key, JSON.stringify(store));
        } catch {
          /* give up */
        }
      }
    }
  }
}
