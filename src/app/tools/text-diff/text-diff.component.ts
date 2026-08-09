import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { diffLines, Change } from 'diff';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="check"><input type="checkbox" [(ngModel)]="ignoreWs" (ngModelChange)="run()" /> Ignore whitespace</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="run()">Compare</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">Original (A)</h3></div>
          <textarea class="textarea fill" [(ngModel)]="a" [appToolHistory]="tool.slug" historyField="a" (ngModelChange)="run()" placeholder="Original text…"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">Changed (B)</h3></div>
          <textarea class="textarea fill" [(ngModel)]="b" [appToolHistory]="tool.slug" historyField="b" (ngModelChange)="run()" placeholder="Changed text…"></textarea>
        </div>
      </div>
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Diff</h3>
          <div class="meta-row">
            <span class="chip">+{{ added }}</span>
            <span class="chip">−{{ removed }}</span>
          </div>
        </div>
        <pre class="diff mono scroll-pane" aria-label="Diff result">@for (part of parts; track $index) {<span [class.add]="part.added" [class.del]="part.removed">{{ part.value }}</span>}</pre>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .diff {
        margin: 0;
        padding: 0.85rem 1rem;
        min-height: min(28dvh, 240px);
        max-height: min(40dvh, 420px);
        overflow: auto;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .add {
        background: color-mix(in srgb, var(--accent-color) 18%, transparent);
        color: var(--text-primary);
      }
      .del {
        background: var(--danger-opacity);
        color: var(--danger);
        text-decoration: line-through;
      }
    `,
  ],
})
export class TextDiffComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  a = '';
  b = '';
  ignoreWs = false;
  parts: Change[] = [];
  added = 0;
  removed = 0;

  run(): void {
    const left = this.ignoreWs ? this.normalize(this.a) : this.a;
    const right = this.ignoreWs ? this.normalize(this.b) : this.b;
    this.parts = diffLines(left, right);
    this.added = this.parts.filter((p) => p.added).reduce((n, p) => n + (p.count || 0), 0);
    this.removed = this.parts.filter((p) => p.removed).reduce((n, p) => n + (p.count || 0), 0);
  }

  private normalize(s: string): string {
    return s
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .join('\n');
  }

  sample(): void {
    this.a = 'Web Utils\nClient-side tools\nPrivacy first\n';
    this.b = 'Web Utils\nClient-side utilities\nPrivacy first\nBeautiful UI\n';
    this.run();
  }

  clear(): void {
    this.a = this.b = '';
    this.parts = [];
    this.added = this.removed = 0;
  }
}
