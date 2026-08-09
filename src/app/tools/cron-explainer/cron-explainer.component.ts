import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import cronstrue from 'cronstrue';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

const EXAMPLES = [
  { expr: '*/5 * * * *', label: 'Every 5 minutes' },
  { expr: '0 9 * * 1-5', label: 'Weekdays at 9:00' },
  { expr: '0 0 1 * *', label: 'First day of month' },
  { expr: '15 14 1 * *', label: '1st of month at 14:15' },
  { expr: '0 22 * * 1-5', label: 'Weeknights at 22:00' },
];

@Component({
  selector: 'app-cron-explainer',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="panel surface">
        <label class="field">
          <span class="field-label">Cron expression</span>
          <input class="input mono" [(ngModel)]="expr" [appToolHistory]="tool.slug" historyField="cron" (ngModelChange)="explain()" placeholder="*/5 * * * *" />
        </label>
        @if (error) { <div class="error-box" style="margin-top:0.75rem">{{ error }}</div> }
        @if (result) {
          <div class="result surface">{{ result }}</div>
        }
      </div>
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">Examples</h3></div>
        <div class="examples">
          @for (ex of examples; track ex.expr) {
            <button type="button" class="ex" (click)="use(ex.expr)">
              <span class="mono expr">{{ ex.expr }}</span>
              <span class="label">{{ ex.label }}</span>
            </button>
          }
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .result {
        margin-top: 1rem;
        padding: 1rem 1.1rem;
        color: var(--text-primary);
        font-size: 1.1rem;
        border-color: color-mix(in srgb, var(--accent-color) 35%, var(--border-color));
        background: var(--accent-opacity);
      }
      .examples {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .ex {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        justify-content: space-between;
        text-align: left;
        padding: 0.7rem 0.85rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: var(--bg-input);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition);
      }
      .ex:hover {
        border-color: color-mix(in srgb, var(--accent-color) 40%, var(--border-color));
        color: var(--text-primary);
      }
      .expr {
        color: var(--accent-color);
      }
    `,
  ],
})
export class CronExplainerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  expr = '*/5 * * * *';
  result = '';
  error = '';
  readonly examples = EXAMPLES;

  constructor() {
    this.explain();
  }

  explain(): void {
    this.error = '';
    this.result = '';
    if (!this.expr.trim()) return;
    try {
      this.result = cronstrue.toString(this.expr.trim(), { verbose: true });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Invalid cron expression';
    }
  }

  use(expr: string): void {
    this.expr = expr;
    this.explain();
  }
}
