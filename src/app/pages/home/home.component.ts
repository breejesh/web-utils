import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TOOLS, TOOL_CATEGORIES, getToolBySlug, searchTools } from '../../core/data/tools.registry';
import { ToolDefinition } from '../../core/models/tool.model';
import { SeoService } from '../../core/services/seo.service';
import { ToolLauncherService } from '../../core/services/tool-launcher.service';
import { UserStorageService } from '../../core/services/user-storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Detection, detectInput, looksLikeData } from '../../shared/utils/smart-detect';

interface Example {
  label: string;
  value: string;
}

const EXAMPLES: Example[] = [
  {
    label: 'JWT',
    value:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQyIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTQ0MDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.bxcsyljfMora0yaLFxmuyZ2w7nfWxpolDc8sMbakN_U',
  },
  { label: 'JSON', value: '{"user":{"id":42,"name":"Ada","roles":["admin","dev"]},"active":true}' },
  { label: 'Epoch', value: '1767225600' },
  { label: 'Base64', value: 'SGVsbG8gZnJvbSB5b3VyIGJyb3dzZXIg8J+RiyDigJQgbm90aGluZyB3YXMgdXBsb2FkZWQu' },
  { label: 'Cron', value: '0 9 * * 1-5' },
  { label: 'SQL', value: 'select id, name, email from users where active = 1 and created_at > now() - interval 7 day order by name' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly storage = inject(UserStorageService);
  private readonly launcher = inject(ToolLauncherService);

  readonly siteName = environment.siteName;
  readonly repoUrl = environment.repoUrl;
  readonly toolCount = TOOLS.length;
  readonly examples = EXAMPLES;

  readonly query = signal('');
  readonly isData = computed(() => looksLikeData(this.query()));

  readonly detections = computed<(Detection & { tool: ToolDefinition })[]>(() => {
    if (!this.isData()) return [];
    return detectInput(this.query())
      .map((d) => ({ ...d, tool: getToolBySlug(d.slug)! }))
      .filter((d) => !!d.tool);
  });

  readonly sections = computed(() => {
    const q = this.isData() ? '' : this.query();
    const matches = new Set(searchTools(q).map((t) => t.slug));
    return [...TOOL_CATEGORIES]
      .sort((a, b) => a.order - b.order)
      .map((cat) => ({ cat, tools: TOOLS.filter((t) => t.category === cat.id && matches.has(t.slug)) }))
      .filter((s) => s.tools.length);
  });

  readonly matchCount = computed(() => this.sections().reduce((n, s) => n + s.tools.length, 0));

  readonly quickTools = computed(() => {
    const marks = this.storage.bookmarks();
    const recent = this.storage.recentTools().map((r) => r.slug);
    const slugs = [...new Set([...marks, ...recent])].slice(0, 6);
    return slugs
      .map((slug) => ({ tool: getToolBySlug(slug), starred: marks.includes(slug) }))
      .filter((x): x is { tool: ToolDefinition; starred: boolean } => !!x.tool);
  });

  ngOnInit(): void {
    this.seo.setHome();
  }

  onInput(value: string): void {
    this.query.set(value);
  }

  useExample(ex: Example, input: HTMLTextAreaElement): void {
    this.query.set(ex.value);
    input.value = ex.value;
    input.focus();
  }

  clear(input: HTMLTextAreaElement): void {
    this.query.set('');
    input.value = '';
    input.focus();
  }

  open(d: Detection): void {
    void this.launcher.launch(d.slug, this.query());
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      const first = this.detections()[0];
      if (first) {
        e.preventDefault();
        this.open(first);
        return;
      }
      const tool = this.sections()[0]?.tools[0];
      if (tool && this.query().trim()) {
        e.preventDefault();
        void this.launcher.launch(tool.slug);
      }
    } else if (e.key === 'Escape' && this.query()) {
      this.clear(e.target as HTMLTextAreaElement);
    }
  }
}
