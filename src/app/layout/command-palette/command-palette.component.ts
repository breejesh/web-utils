import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TOOLS, getCategory, getToolBySlug, searchTools } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLauncherService } from '../../core/services/tool-launcher.service';
import { UserStorageService } from '../../core/services/user-storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../shared/icons';
import { detectInput, looksLikeData as isData } from '../../shared/utils/smart-detect';

interface PaletteItem {
  id: string;
  group: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  badge?: string;
  run: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  readonly palette = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly launcher = inject(ToolLauncherService);
  private readonly storage = inject(UserStorageService);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);

  @ViewChild('input') inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('list') listRef?: ElementRef<HTMLElement>;

  readonly query = signal('');
  readonly active = signal(0);
  private returnFocus: HTMLElement | null = null;

  readonly items = computed<PaletteItem[]>(() => {
    const q = this.query();
    const trimmed = q.trim();
    const items: PaletteItem[] = [];

    // Looks like data rather than a search term? Offer to open it in the right tool.
    const looksLikeData = isData(q);
    if (trimmed && looksLikeData) {
      for (const d of detectInput(q)) {
        const tool = getToolBySlug(d.slug);
        if (!tool) continue;
        items.push({
          id: `detect-${tool.slug}`,
          group: 'Open your input in',
          icon: tool.icon,
          title: tool.name,
          subtitle: [d.label, d.preview].filter(Boolean).join(' — '),
          badge: tool.primaryField ? 'Pre-filled' : undefined,
          run: () => this.launcher.launch(tool.slug, q),
        });
      }
    }

    const toolItem = (t: ToolDefinition, group: string): PaletteItem => ({
      id: `${group}-${t.slug}`,
      group,
      icon: t.icon,
      title: t.name,
      subtitle: t.description,
      badge: getCategory(t.category)?.name,
      run: () => this.router.navigate(['/tools', t.slug]),
    });

    if (!trimmed) {
      const recent = this.storage
        .recentTools()
        .map((r) => getToolBySlug(r.slug))
        .filter((t): t is ToolDefinition => !!t)
        .slice(0, 4);
      recent.forEach((t) => items.push(toolItem(t, 'Recent')));
      const seen = new Set(recent.map((t) => t.slug));
      TOOLS.filter((t) => !seen.has(t.slug)).forEach((t) => items.push(toolItem(t, 'All tools')));
    } else if (!looksLikeData || items.length === 0) {
      searchTools(trimmed).forEach((t) => items.push(toolItem(t, 'Tools')));
    }

    const actions: PaletteItem[] = [
      {
        id: 'act-theme',
        group: 'Actions',
        icon: this.theme.theme() === 'dark' ? 'sun' : 'moon',
        title: `Switch to ${this.theme.theme() === 'dark' ? 'light' : 'dark'} theme`,
        run: () => this.theme.toggle(),
      },
      { id: 'act-home', group: 'Actions', icon: 'sparkles', title: 'Browse all tools', run: () => this.router.navigate(['/']) },
      { id: 'act-privacy', group: 'Actions', icon: 'shield-check', title: 'How privacy works here', run: () => this.router.navigate(['/privacy']) },
      {
        id: 'act-clear',
        group: 'Actions',
        icon: 'trash',
        title: 'Clear all local data',
        subtitle: 'Bookmarks, recents and history in this browser',
        run: () => {
          this.storage.clearAllLocalData();
          this.toast.success('Local data cleared');
        },
      },
    ];
    if (!trimmed) {
      items.push(...actions);
    } else if (!looksLikeData) {
      const lower = trimmed.toLowerCase();
      items.push(...actions.filter((a) => a.title.toLowerCase().includes(lower)));
    }
    return items;
  });

  /** Items grouped for rendering, keeping a flat index for keyboard navigation. */
  readonly groups = computed(() => {
    const out: { name: string; items: { item: PaletteItem; index: number }[] }[] = [];
    this.items().forEach((item, index) => {
      let g = out.find((x) => x.name === item.group);
      if (!g) out.push((g = { name: item.group, items: [] }));
      g.items.push({ item, index });
    });
    return out;
  });

  constructor() {
    effect(() => {
      if (this.palette.isOpen()) {
        this.returnFocus = this.document.activeElement as HTMLElement | null;
        this.query.set(this.palette.initialQuery());
        this.active.set(0);
        setTimeout(() => this.inputRef?.nativeElement.focus());
        this.document.documentElement.style.overflow = 'hidden';
      } else {
        this.document.documentElement.style.overflow = '';
      }
    });
  }

  onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  onKeydown(e: KeyboardEvent): void {
    const n = this.items().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.move(n ? (this.active() + 1) % n : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.move(n ? (this.active() - 1 + n) % n : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.select(this.active());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      e.preventDefault();
    }
  }

  move(index: number): void {
    this.active.set(index);
    queueMicrotask(() =>
      this.listRef?.nativeElement.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
    );
  }

  select(index: number): void {
    const item = this.items()[index];
    if (!item) return;
    this.close(false);
    item.run();
  }

  close(restoreFocus = true): void {
    this.palette.close();
    if (restoreFocus) this.returnFocus?.focus?.();
  }
}
