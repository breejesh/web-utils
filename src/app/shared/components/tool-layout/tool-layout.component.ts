import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { getCategory, getRelatedTools } from '../../../core/data/tools.registry';
import { TOOL_CONTENT } from '../../../core/data/tools.content';
import { ToolContent, ToolDefinition } from '../../../core/models/tool.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SeoService } from '../../../core/services/seo.service';
import { ToastService } from '../../../core/services/toast.service';
import { HistoryEntry, UserStorageService } from '../../../core/services/user-storage.service';
import { IconComponent } from '../icon/icon.component';

/** Shared inputs above this length are shared as a plain link (URLs get unwieldy). */
const MAX_SHARE_CHARS = 6000;
const SHARE_PARAM = 'input=';

@Component({
  selector: 'app-tool-layout',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './tool-layout.component.html',
  styleUrl: './tool-layout.component.scss',
})
export class ToolLayoutComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;

  private readonly storage = inject(UserStorageService);
  private readonly toast = inject(ToastService);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly showHistory = signal(false);
  private readonly slug = signal('');

  content: ToolContent | undefined;
  related: ToolDefinition[] = [];
  categoryName = '';

  readonly bookmarked = computed(() => this.storage.bookmarks().includes(this.slug()));
  readonly history = computed(() => (this.slug() ? this.storage.allHistoryFor(this.slug()) : []));
  readonly historyEnabled = computed(() => this.storage.isHistoryEnabled(this.slug()));

  ngOnInit(): void {
    this.slug.set(this.tool.slug);
    this.content = TOOL_CONTENT[this.tool.slug];
    this.related = getRelatedTools(this.tool);
    this.categoryName = getCategory(this.tool.category)?.name || this.tool.category;

    this.seo.setTool(this.tool);
    if (!this.isBrowser) return;
    this.storage.touchRecent(this.tool.slug);
    this.analytics.toolOpen(this.tool.slug);
    this.applySharedInput();
  }

  toggleBookmark(): void {
    const on = this.storage.toggleBookmark(this.tool.slug);
    this.toast.success(on ? 'Bookmarked in this browser' : 'Bookmark removed');
  }

  toggleHistoryEnabled(): void {
    const next = !this.historyEnabled();
    this.storage.setHistoryEnabled(this.tool.slug, next);
    this.toast.success(next ? 'Inputs will be remembered on this device' : 'History off — nothing will be saved');
  }

  async share(): Promise<void> {
    const base = `${environment.siteUrl}/tools/${this.tool.slug}`;
    const field = this.tool.primaryField;
    const value = field ? this.storage.liveValue(this.tool.slug, field) : '';
    const withInput = !!value.trim() && !this.tool.sensitive && value.length <= MAX_SHARE_CHARS;
    const url = withInput ? `${base}#${SHARE_PARAM}${encodeBase64Url(value)}` : base;

    try {
      await navigator.clipboard.writeText(url);
      if (withInput) {
        this.toast.success('Link copied with your input in the #fragment, which is never sent to any server');
      } else if (value && this.tool.sensitive) {
        this.toast.success('Link copied. Your input was left out because it may be a secret');
      } else {
        this.toast.success('Link copied');
      }
    } catch {
      this.toast.error('Could not copy the link');
    }
  }

  toggleHistoryPanel(): void {
    this.showHistory.update((v) => !v);
  }

  restore(entry: HistoryEntry): void {
    this.storage.requestRestore(this.tool.slug, entry.value, entry.field);
    this.toast.success('Restored from history');
    this.showHistory.set(false);
  }

  removeEntry(entry: HistoryEntry, ev: Event): void {
    ev.stopPropagation();
    this.storage.removeHistoryEntry(this.tool.slug, entry.id);
  }

  clearToolHistory(): void {
    this.storage.clearHistory(this.tool.slug);
    this.toast.success('Cleared history for this tool');
  }

  /** Reads `#input=<base64url>` from a share link, pre-fills the tool, then removes it from the address bar. */
  private applySharedInput(): void {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith(SHARE_PARAM) || !this.tool.primaryField) return;
    const value = decodeBase64Url(hash.slice(SHARE_PARAM.length));
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
    if (value === null) {
      this.toast.error('That share link looks damaged');
      return;
    }
    this.storage.requestRestore(this.tool.slug, value, this.tool.primaryField);
  }
}

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}
