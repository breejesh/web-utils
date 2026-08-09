import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-date-calculator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="cards">
        <div class="panel surface">
          <h3 class="panel-title">Age / duration from birth date</h3>
          <label class="field"><span class="field-label">Birth date</span>
            <input class="input" type="date" [(ngModel)]="birth" (ngModelChange)="calcAge()" />
          </label>
          <pre class="result mono">{{ ageResult }}</pre>
        </div>
        <div class="panel surface">
          <h3 class="panel-title">Days between dates</h3>
          <div class="row">
            <label class="field"><span class="field-label">Start</span><input class="input" type="date" [(ngModel)]="start" (ngModelChange)="calcDiff()" /></label>
            <label class="field"><span class="field-label">End</span><input class="input" type="date" [(ngModel)]="end" (ngModelChange)="calcDiff()" /></label>
          </div>
          <pre class="result mono">{{ diffResult }}</pre>
        </div>
        <div class="panel surface">
          <h3 class="panel-title">Add / subtract days</h3>
          <div class="row">
            <label class="field"><span class="field-label">Date</span><input class="input" type="date" [(ngModel)]="base" (ngModelChange)="calcAdd()" /></label>
            <label class="field"><span class="field-label">Days (+/-)</span><input class="input" type="number" [(ngModel)]="days" (ngModelChange)="calcAdd()" /></label>
          </div>
          <pre class="result mono">{{ addResult }}</pre>
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
        margin: 0.65rem 0;
      }
      .result {
        margin: 0.75rem 0 0;
        padding: 0.85rem 1rem;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 13px;
        white-space: pre-wrap;
        color: var(--text-primary);
        min-height: 4.5rem;
      }
    `,
  ],
})
export class DateCalculatorComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  birth = '1995-01-01';
  start = '';
  end = '';
  base = '';
  days = 30;
  ageResult = '';
  diffResult = '';
  addResult = '';

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.start = today;
    this.end = today;
    this.base = today;
    this.calcAge();
    this.calcDiff();
    this.calcAdd();
  }

  calcAge(): void {
    const b = new Date(this.birth + 'T00:00:00');
    if (Number.isNaN(b.getTime())) {
      this.ageResult = 'Invalid date';
      return;
    }
    const now = new Date();
    let y = now.getFullYear() - b.getFullYear();
    let m = now.getMonth() - b.getMonth();
    let d = now.getDate() - b.getDate();
    if (d < 0) {
      m--;
      d += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    const totalDays = Math.floor((now.getTime() - b.getTime()) / 86400000);
    this.ageResult = `${y} years, ${m} months, ${d} days\n${totalDays} total days`;
  }

  calcDiff(): void {
    const a = new Date(this.start + 'T00:00:00');
    const b = new Date(this.end + 'T00:00:00');
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      this.diffResult = 'Invalid date';
      return;
    }
    const days = Math.round((b.getTime() - a.getTime()) / 86400000);
    this.diffResult = `${days} day(s)\n${Math.abs(days / 7).toFixed(1)} weeks`;
  }

  calcAdd(): void {
    const a = new Date(this.base + 'T00:00:00');
    if (Number.isNaN(a.getTime())) {
      this.addResult = 'Invalid date';
      return;
    }
    a.setDate(a.getDate() + Number(this.days || 0));
    this.addResult = a.toISOString().slice(0, 10) + '\n' + a.toDateString();
  }
}
