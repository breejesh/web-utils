import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TOOLS, TOOL_CATEGORIES, getToolBySlug } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToastService } from '../../core/services/toast.service';
import { UserStorageService } from '../../core/services/user-storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';

/** Max items shown in sidebar Bookmarks / Recent (keeps nav short). */
const SIDEBAR_LIST_LIMIT = 4;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, BrandMarkComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private readonly storage = inject(UserStorageService);
  private readonly toast = inject(ToastService);

  readonly siteName = environment.siteName;
  readonly toolCount = TOOLS.length;
  readonly groups = [...TOOL_CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({ cat, tools: TOOLS.filter((t) => t.category === cat.id) }))
    .filter((g) => g.tools.length);

  readonly bookmarkedTools = computed(() =>
    this.storage
      .bookmarks()
      .map((slug) => getToolBySlug(slug))
      .filter((t): t is ToolDefinition => !!t)
      .slice(0, SIDEBAR_LIST_LIMIT)
  );

  readonly recentTools = computed(() => {
    const marked = new Set(this.storage.bookmarks());
    return this.storage
      .recentTools()
      .map((e) => getToolBySlug(e.slug))
      .filter((t): t is ToolDefinition => !!t && !marked.has(t.slug))
      .slice(0, SIDEBAR_LIST_LIMIT);
  });

  clearLocal(): void {
    this.storage.clearAllLocalData();
    this.toast.success('Cleared bookmarks, recents and history from this browser');
  }
}
