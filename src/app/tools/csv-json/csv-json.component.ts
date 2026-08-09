import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-csv-json',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="check"><input type="checkbox" [(ngModel)]="headerRow" /> First row is header</label>
        <label class="field" style="max-width:120px">
          <span class="field-label">Delimiter</span>
          <input class="input mono" [(ngModel)]="delimiter" maxlength="1" />
        </label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="csvToJson()">CSV → JSON</button>
        <button type="button" class="btn btn-primary" (click)="jsonToCsv()">JSON → CSV</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">CSV</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(csv)">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="csv" [appToolHistory]="tool.slug" historyField="csv" placeholder="a,b,c&#10;1,2,3"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">JSON</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(json)">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="json" [appToolHistory]="tool.slug" historyField="json" placeholder='[{"a":"1"}]'></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
})
export class CsvJsonComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  csv = '';
  json = '';
  error = '';
  headerRow = true;
  delimiter = ',';

  csvToJson(): void {
    this.error = '';
    try {
      const rows = this.parseCsv(this.csv, this.delimiter || ',');
      if (!rows.length) {
        this.json = '[]';
        return;
      }
      if (this.headerRow) {
        const headers = rows[0];
        const data = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => (obj[h || `col${i + 1}`] = row[i] ?? ''));
          return obj;
        });
        this.json = JSON.stringify(data, null, 2);
      } else {
        this.json = JSON.stringify(rows, null, 2);
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'CSV parse failed';
    }
  }

  jsonToCsv(): void {
    this.error = '';
    try {
      const data = JSON.parse(this.json);
      if (!Array.isArray(data) || !data.length) {
        this.csv = '';
        return;
      }
      if (typeof data[0] !== 'object' || data[0] === null) {
        this.csv = data.map((v: unknown) => this.escape(String(v), this.delimiter)).join('\n');
        return;
      }
      const records = data as Record<string, unknown>[];
      const keySet = new Set<string>();
      for (const row of records) {
        Object.keys(row || {}).forEach((k) => keySet.add(k));
      }
      const keys = Array.from(keySet);
      const lines = [keys.map((k) => this.escape(k, this.delimiter)).join(this.delimiter)];
      for (const row of records) {
        lines.push(keys.map((k) => this.escape(String(row?.[k] ?? ''), this.delimiter)).join(this.delimiter));
      }
      this.csv = lines.join('\n');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Invalid JSON';
    }
  }

  private parseCsv(text: string, delim: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQ = false;
        } else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === delim) {
        row.push(cur);
        cur = '';
      } else if (c === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else if (c !== '\r') cur += c;
    }
    if (cur.length || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows.filter((r) => r.some((cell) => cell.length));
  }

  private escape(v: string, delim: string): string {
    if (/["\n\r]/.test(v) || v.includes(delim)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  }

  sample(): void {
    this.csv = 'name,role,city\nBreejesh,Engineer,Remote\nAda,Pioneer,London';
    this.csvToJson();
  }

  clear(): void {
    this.csv = this.json = this.error = '';
  }
}
