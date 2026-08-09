import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-case-converter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Input</h3>
          <button type="button" class="btn btn-danger btn-sm" (click)="input = ''; convert()">Clear</button>
        </div>
        <textarea class="textarea" [(ngModel)]="input" [appToolHistory]="tool.slug" rows="6" (ngModelChange)="convert()" placeholder="Type text…"></textarea>
      </div>
      <div class="results">
        @for (row of rows; track row.key) {
          <div class="panel surface row">
            <div>
              <div class="panel-title">{{ row.label }}</div>
              <div class="val mono">{{ row.value || '—' }}</div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(row.value)" [disabled]="!row.value">Copy</button>
          </div>
        }
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .results {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .val {
        margin-top: 0.35rem;
        color: var(--text-primary);
        word-break: break-word;
        font-size: 14px;
      }
    `,
  ],
})
export class CaseConverterComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  input = '';
  rows: { key: string; label: string; value: string }[] = [];

  convert(): void {
    const s = this.input;
    const words = this.words(s);
    this.rows = [
      { key: 'lower', label: 'lower case', value: s.toLowerCase() },
      { key: 'upper', label: 'UPPER CASE', value: s.toUpperCase() },
      { key: 'title', label: 'Title Case', value: words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') },
      { key: 'sentence', label: 'Sentence case', value: s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '' },
      { key: 'camel', label: 'camelCase', value: words.map((w, i) => (i === 0 ? w.toLowerCase() : this.cap(w))).join('') },
      { key: 'pascal', label: 'PascalCase', value: words.map((w) => this.cap(w)).join('') },
      { key: 'snake', label: 'snake_case', value: words.map((w) => w.toLowerCase()).join('_') },
      { key: 'kebab', label: 'kebab-case', value: words.map((w) => w.toLowerCase()).join('-') },
      { key: 'const', label: 'CONSTANT_CASE', value: words.map((w) => w.toUpperCase()).join('_') },
    ];
  }

  private words(s: string): string[] {
    return s
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_\-./]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  private cap(w: string): string {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }
}
