import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { TOOL_CATEGORIES, TOOLS, getToolBySlug, searchTools } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { SeoService } from '../../core/services/seo.service';
import { UserStorageService } from '../../core/services/user-storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly storage = inject(UserStorageService);

  readonly siteName = environment.siteName;
  readonly privacy = environment.privacyTagline;
  readonly categories = TOOL_CATEGORIES;
  readonly allTools = TOOLS;
  query = '';

  readonly bookmarkedTools = computed(() =>
    this.storage
      .bookmarks()
      .map((slug) => getToolBySlug(slug))
      .filter((t): t is ToolDefinition => !!t)
  );

  readonly recentTools = computed(() =>
    this.storage
      .recentTools()
      .map((e) => getToolBySlug(e.slug))
      .filter((t): t is ToolDefinition => !!t)
  );

  ngOnInit(): void {
    this.seo.setHome();
  }

  get tools(): ToolDefinition[] {
    return searchTools(this.query);
  }

  get featured(): ToolDefinition[] {
    return TOOLS.filter((t) => t.featured);
  }

  get popular(): ToolDefinition[] {
    return TOOLS.filter((t) => t.popular);
  }

  toolsIn(categoryId: string): ToolDefinition[] {
    return this.tools.filter((t) => t.category === categoryId);
  }
}
