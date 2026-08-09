import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format } from 'sql-formatter';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-sql-formatter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:180px">
          <span class="field-label">Dialect</span>
          <select class="select" [(ngModel)]="lang">
            <option value="sql">Standard SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="tsql">T-SQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="run()">Format</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(output)" [disabled]="!output">Copy</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">SQL input</h3></div>
          <textarea class="textarea fill" [(ngModel)]="input" [appToolHistory]="tool.slug" placeholder="select * from users where id = 1"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">Formatted</h3></div>
          <textarea class="textarea fill" [(ngModel)]="output"></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
})
export class SqlFormatterComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  input = '';
  output = '';
  error = '';
  lang: 'sql' | 'mysql' | 'postgresql' | 'tsql' | 'sqlite' = 'sql';

  run(): void {
    this.error = '';
    try {
      this.output = format(this.input, { language: this.lang, tabWidth: 2, keywordCase: 'upper' });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Format failed';
    }
  }

  sample(): void {
    this.input =
      'select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=1 group by u.id,u.name order by orders desc;';
    this.run();
  }

  clear(): void {
    this.input = this.output = this.error = '';
  }
}
