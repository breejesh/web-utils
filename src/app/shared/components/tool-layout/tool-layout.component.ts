import { DatePipe } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { getCategory } from '../../../core/data/tools.registry';
import { ToolDefinition } from '../../../core/models/tool.model';
import { ToastService } from '../../../core/services/toast.service';
import { HistoryEntry, UserStorageService } from '../../../core/services/user-storage.service';

@Component({
  selector: 'app-tool-layout',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './tool-layout.component.html',
  styleUrl: './tool-layout.component.scss',
})
export class ToolLayoutComponent {
  @Input({ required: true }) tool!: ToolDefinition;

  private readonly storage = inject(UserStorageService);
  private readonly toast = inject(ToastService);

  readonly privacy = environment.privacyTagline;
  showHistory = false;

  readonly bookmarked = computed(() => {
    const marks = this.storage.bookmarks();
    return this.tool ? marks.includes(this.tool.slug) : false;
  });

  readonly history = computed(() => {
    // Read signal so UI updates when history changes
    return this.tool ? this.storage.allHistoryFor(this.tool.slug) : [];
  });

  get categoryName(): string {
    return getCategory(this.tool.category)?.name || this.tool.category;
  }

  toggleBookmark(): void {
    const on = this.storage.toggleBookmark(this.tool.slug);
    this.toast.success(on ? 'Bookmarked in this browser' : 'Removed bookmark');
  }

  toggleHistoryPanel(): void {
    this.showHistory = !this.showHistory;
  }

  restore(entry: HistoryEntry): void {
    this.storage.requestRestore(this.tool.slug, entry.value, entry.field);
    this.toast.success('Restored from history');
    this.showHistory = false;
  }

  removeEntry(entry: HistoryEntry, ev: Event): void {
    ev.stopPropagation();
    this.storage.removeHistoryEntry(this.tool.slug, entry.id);
  }

  clearToolHistory(): void {
    this.storage.clearHistory(this.tool.slug);
    this.toast.success('Cleared history for this tool');
  }
}
