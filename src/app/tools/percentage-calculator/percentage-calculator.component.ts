import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-percentage-calculator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="cards">
        <div class="panel surface">
          <h3 class="panel-title">What is X% of Y?</h3>
          <div class="row">
            <label class="field"><span class="field-label">X %</span><input class="input" type="number" [(ngModel)]="p1x" (ngModelChange)="calc1()" /></label>
            <label class="field"><span class="field-label">Y</span><input class="input" type="number" [(ngModel)]="p1y" (ngModelChange)="calc1()" /></label>
          </div>
          <div class="stat"><span class="k">Result</span><span class="v">{{ r1 }}</span></div>
        </div>
        <div class="panel surface">
          <h3 class="panel-title">X is what % of Y?</h3>
          <div class="row">
            <label class="field"><span class="field-label">X</span><input class="input" type="number" [(ngModel)]="p2x" (ngModelChange)="calc2()" /></label>
            <label class="field"><span class="field-label">Y</span><input class="input" type="number" [(ngModel)]="p2y" (ngModelChange)="calc2()" /></label>
          </div>
          <div class="stat"><span class="k">Result</span><span class="v">{{ r2 }}%</span></div>
        </div>
        <div class="panel surface">
          <h3 class="panel-title">Percentage change</h3>
          <div class="row">
            <label class="field"><span class="field-label">From</span><input class="input" type="number" [(ngModel)]="from" (ngModelChange)="calc3()" /></label>
            <label class="field"><span class="field-label">To</span><input class="input" type="number" [(ngModel)]="to" (ngModelChange)="calc3()" /></label>
          </div>
          <div class="stat"><span class="k">Change</span><span class="v">{{ r3 }}%</span></div>
        </div>
        <div class="panel surface">
          <h3 class="panel-title">Discount / tip</h3>
          <div class="row">
            <label class="field"><span class="field-label">Price</span><input class="input" type="number" [(ngModel)]="price" (ngModelChange)="calc4()" /></label>
            <label class="field"><span class="field-label">% off / tip</span><input class="input" type="number" [(ngModel)]="disc" (ngModelChange)="calc4()" /></label>
          </div>
          <div class="stat-grid">
            <div class="stat"><span class="k">Amount</span><span class="v">{{ r4a }}</span></div>
            <div class="stat"><span class="k">Final</span><span class="v">{{ r4b }}</span></div>
          </div>
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
        margin: 0.75rem 0;
      }
      .stat {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class PercentageCalculatorComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  p1x = 15;
  p1y = 200;
  r1 = '30';
  p2x = 30;
  p2y = 200;
  r2 = '15';
  from = 80;
  to = 100;
  r3 = '25';
  price = 100;
  disc = 10;
  r4a = '10';
  r4b = '90';

  constructor() {
    this.calc1();
    this.calc2();
    this.calc3();
    this.calc4();
  }

  private fmt(n: number): string {
    if (!Number.isFinite(n)) return '—';
    return String(+n.toPrecision(10));
  }

  calc1(): void {
    this.r1 = this.fmt((this.p1x / 100) * this.p1y);
  }
  calc2(): void {
    this.r2 = this.p2y === 0 ? '—' : this.fmt((this.p2x / this.p2y) * 100);
  }
  calc3(): void {
    this.r3 = this.from === 0 ? '—' : this.fmt(((this.to - this.from) / this.from) * 100);
  }
  calc4(): void {
    const a = (this.disc / 100) * this.price;
    this.r4a = this.fmt(a);
    this.r4b = this.fmt(this.price - a);
  }
}
