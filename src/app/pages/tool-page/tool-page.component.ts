import { NgComponentOutlet } from '@angular/common';
import { Component, OnInit, Type, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { getToolBySlug } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SeoService } from '../../core/services/seo.service';
import { UserStorageService } from '../../core/services/user-storage.service';
import { TOOL_COMPONENT_MAP } from '../../tools/tool-component-map';

@Component({
  selector: 'app-tool-page',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink],
  template: `
    @if (tool && component) {
      <ng-container *ngComponentOutlet="component; inputs: toolInputs" />
    } @else {
      <section class="missing surface">
        <h1>Tool not found</h1>
        <p>That utility doesn’t exist (or the URL is mistyped).</p>
        <a routerLink="/" class="btn btn-primary">Back to all tools</a>
      </section>
    }
  `,
  styles: [
    `
      .missing {
        padding: 2rem;
        text-align: center;
      }
      h1 {
        color: var(--text-primary);
        margin-top: 0;
      }
      .btn {
        margin-top: 1rem;
        display: inline-flex;
      }
    `,
  ],
})
export class ToolPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly userStorage = inject(UserStorageService);

  tool: ToolDefinition | null = null;
  component: Type<unknown> | null = null;
  toolInputs: Record<string, unknown> = {};

  ngOnInit(): void {
    const slug =
      (this.route.snapshot.data['toolSlug'] as string | undefined) ||
      this.route.snapshot.paramMap.get('slug') ||
      '';
    const tool = getToolBySlug(slug) || null;
    this.tool = tool;
    this.component = tool ? TOOL_COMPONENT_MAP[tool.component] : null;
    this.toolInputs = tool ? { tool } : {};
    if (tool) {
      this.seo.setTool(tool);
      this.userStorage.touchRecent(tool.slug);
      this.analytics.toolOpen(tool.slug);
      this.analytics.pageView(`/tools/${tool.slug}`, tool.seoTitle);
    } else {
      this.seo.setNotFound();
    }
  }
}
