import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';
import { downloadText } from '../../shared/utils/download';

export interface JsonTreeNode {
  key: string;
  valuePreview: string;
  type: string;
  path: string;
  expanded: boolean;
  children?: JsonTreeNode[];
  isLeaf: boolean;
}

const STORAGE_KEY = 'web-utils-json-formatter';

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, NgTemplateOutlet, ToolHistoryDirective],
  templateUrl: './json-formatter.component.html',
  styleUrl: './json-formatter.component.scss',
})
export class JsonFormatterComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  input = '';
  output = '';
  error = '';
  errorLine: number | null = null;
  ok = false;
  indent: 2 | 3 | 4 | 0 = 2;
  sortKeys = false;
  autoUpdate = true;
  view: 'text' | 'tree' = 'text';
  tree: JsonTreeNode[] = [];
  parsed: unknown = null;
  stats = { keys: 0, arrays: 0, objects: 0, size: 0 };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.input = saved;
        this.format();
      }
    }
  }

  onInputChange(): void {
    this.persist();
    if (this.autoUpdate) this.format();
  }

  format(): void {
    this.run(this.indent === 0 ? 2 : this.indent, false);
  }

  minify(): void {
    this.run(0, false);
  }

  validateOnly(): void {
    this.run(this.indent === 0 ? 2 : this.indent, true);
  }

  private run(spaces: number, validateOnly: boolean): void {
    this.error = '';
    this.errorLine = null;
    this.ok = false;
    this.tree = [];
    this.parsed = null;
    if (!this.input.trim()) {
      this.output = '';
      return;
    }
    try {
      let data = JSON.parse(this.input);
      if (this.sortKeys) data = this.sortDeep(data);
      this.parsed = data;
      this.ok = true;
      if (!validateOnly) {
        this.output = JSON.stringify(data, null, spaces === 0 ? 0 : spaces);
      } else if (!this.output) {
        this.output = JSON.stringify(data, null, spaces === 0 ? 2 : spaces);
      }
      this.tree = this.toTree(data, 'root');
      this.stats = this.collectStats(data);
      this.persist();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      this.error = msg;
      const m = msg.match(/position\s+(\d+)/i) || msg.match(/at position (\d+)/i);
      if (m) {
        const pos = Number(m[1]);
        this.errorLine = this.input.slice(0, pos).split('\n').length;
      }
    }
  }

  /** Best-effort fixer: wrap keys in quotes, trailing commas, single quotes */
  fixJson(): void {
    let s = this.input.trim();
    if (!s) return;
    try {
      // trailing commas
      s = s.replace(/,\s*([}\]])/g, '$1');
      // single-quoted strings → double
      s = s.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (_, inner) => `"${inner.replace(/"/g, '\\"')}"`);
      // unquoted keys
      s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
      this.input = s;
      this.format();
      if (this.ok) this.toast.success('Applied common JSON fixes');
      else this.toast.error('Still invalid after auto-fix');
    } catch {
      this.toast.error('Auto-fix failed');
    }
  }

  private sortDeep(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((v) => this.sortDeep(v));
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce((acc, k) => {
          acc[k] = this.sortDeep(obj[k]);
          return acc;
        }, {} as Record<string, unknown>);
    }
    return value;
  }

  private toTree(value: unknown, key: string, path = ''): JsonTreeNode[] {
    const p = path ? `${path}.${key}` : key;
    if (value === null || typeof value !== 'object') {
      return [
        {
          key,
          valuePreview: JSON.stringify(value),
          type: value === null ? 'null' : typeof value,
          path: p,
          expanded: false,
          isLeaf: true,
        },
      ];
    }
    if (Array.isArray(value)) {
      return [
        {
          key,
          valuePreview: `Array(${value.length})`,
          type: 'array',
          path: p,
          expanded: path.split('.').length < 3,
          isLeaf: false,
          children: value.flatMap((v, i) => this.toTree(v, String(i), p)),
        },
      ];
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    return [
      {
        key,
        valuePreview: `Object{${keys.length}}`,
        type: 'object',
        path: p,
        expanded: path.split('.').length < 3,
        isLeaf: false,
        children: keys.flatMap((k) => this.toTree(obj[k], k, p)),
      },
    ];
  }

  private collectStats(value: unknown): { keys: number; arrays: number; objects: number; size: number } {
    let keys = 0,
      arrays = 0,
      objects = 0;
    const walk = (v: unknown) => {
      if (Array.isArray(v)) {
        arrays++;
        v.forEach(walk);
      } else if (v && typeof v === 'object') {
        objects++;
        Object.keys(v as object).forEach((k) => {
          keys++;
          walk((v as Record<string, unknown>)[k]);
        });
      }
    };
    walk(value);
    return { keys, arrays, objects, size: new Blob([this.output || this.input]).size };
  }

  toggle(node: JsonTreeNode): void {
    if (!node.isLeaf) node.expanded = !node.expanded;
  }

  sample(): void {
    this.input = JSON.stringify(
      {
        InsuranceCompanies: {
          'Top Insurance Companies': [
            { No: '1', Name: 'Berkshire Hathaway (BRK.A)', MarketCapitalization: '$308 billion' },
          ],
          source: 'investopedia.com',
          Time: 'Feb 2019',
        },
      },
      null,
      2
    );
    this.format();
  }

  clear(): void {
    this.input = this.output = this.error = '';
    this.ok = false;
    this.tree = [];
    this.errorLine = null;
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(STORAGE_KEY);
  }

  loadFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.input = String(reader.result || '');
      this.format();
      this.toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
    (ev.target as HTMLInputElement).value = '';
  }

  download(): void {
    if (!this.output) return;
    downloadText('formatted.json', this.output, 'application/json');
    this.toast.success('Download started');
  }

  printJson(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre style="font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;padding:1rem">${this.escape(this.output || this.input)}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private persist(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (this.input.length < 500_000) localStorage.setItem(STORAGE_KEY, this.input);
    } catch {
      /* quota */
    }
  }
}
