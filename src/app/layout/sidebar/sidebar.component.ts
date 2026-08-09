import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TOOL_CATEGORIES, getToolBySlug, searchTools } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToastService } from '../../core/services/toast.service';
import { UserStorageService } from '../../core/services/user-storage.service';

/** Max items shown in sidebar Bookmarks / Recent (keeps nav short). */
const SIDEBAR_LIST_LIMIT = 5;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() open = false;
  @Input() query = '';
  @Output() navigate = new EventEmitter<void>();

  private readonly storage = inject(UserStorageService);
  private readonly toast = inject(ToastService);

  readonly siteName = environment.siteName;
  readonly categories = TOOL_CATEGORIES;

  readonly bookmarkedTools = computed(() =>
    this.storage
      .bookmarks()
      .map((slug) => getToolBySlug(slug))
      .filter((t): t is ToolDefinition => !!t)
      .slice(0, SIDEBAR_LIST_LIMIT)
  );

  readonly recentTools = computed(() =>
    this.storage
      .recentTools()
      .map((e) => getToolBySlug(e.slug))
      .filter((t): t is ToolDefinition => !!t)
      .slice(0, SIDEBAR_LIST_LIMIT)
  );

  get tools(): ToolDefinition[] {
    return searchTools(this.query);
  }

  toolsFor(categoryId: string): ToolDefinition[] {
    return this.tools.filter((t) => t.category === categoryId);
  }

  onNav(): void {
    this.navigate.emit();
  }

  clearLocal(): void {
    this.storage.clearAllLocalData();
    this.toast.success('Cleared bookmarks, recent tools, and history');
  }
}
