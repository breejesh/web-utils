import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

interface UnitDef {
  id: string;
  label: string;
  toBase: number; // multiply to get base unit
}

interface Category {
  id: string;
  name: string;
  units: UnitDef[];
}

const CATS: Category[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'm', label: 'Meters', toBase: 1 },
      { id: 'km', label: 'Kilometers', toBase: 1000 },
      { id: 'cm', label: 'Centimeters', toBase: 0.01 },
      { id: 'mm', label: 'Millimeters', toBase: 0.001 },
      { id: 'mi', label: 'Miles', toBase: 1609.344 },
      { id: 'ft', label: 'Feet', toBase: 0.3048 },
      { id: 'in', label: 'Inches', toBase: 0.0254 },
    ],
  },
  {
    id: 'mass',
    name: 'Weight',
    units: [
      { id: 'kg', label: 'Kilograms', toBase: 1 },
      { id: 'g', label: 'Grams', toBase: 0.001 },
      { id: 'lb', label: 'Pounds', toBase: 0.45359237 },
      { id: 'oz', label: 'Ounces', toBase: 0.028349523125 },
    ],
  },
  {
    id: 'temp',
    name: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius', toBase: 1 },
      { id: 'f', label: 'Fahrenheit', toBase: 1 },
      { id: 'k', label: 'Kelvin', toBase: 1 },
    ],
  },
  {
    id: 'data',
    name: 'Data size',
    units: [
      { id: 'b', label: 'Bytes', toBase: 1 },
      { id: 'kb', label: 'Kilobytes (10³)', toBase: 1e3 },
      { id: 'mb', label: 'Megabytes (10⁶)', toBase: 1e6 },
      { id: 'gb', label: 'Gigabytes (10⁹)', toBase: 1e9 },
      { id: 'kib', label: 'KiB (1024)', toBase: 1024 },
      { id: 'mib', label: 'MiB', toBase: 1024 ** 2 },
      { id: 'gib', label: 'GiB', toBase: 1024 ** 3 },
    ],
  },
];

@Component({
  selector: 'app-unit-converter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="min-width:180px">
          <span class="field-label">Category</span>
          <select class="select" [(ngModel)]="catId" (ngModelChange)="onCat()">
            @for (c of cats; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </label>
      </div>
      <div class="grid-2">
        <div class="panel surface">
          <label class="field">
            <span class="field-label">From</span>
            <select class="select" [(ngModel)]="fromId" (ngModelChange)="convert()">
              @for (u of units; track u.id) {
                <option [value]="u.id">{{ u.label }}</option>
              }
            </select>
          </label>
          <label class="field" style="margin-top:0.75rem">
            <span class="field-label">Value</span>
            <input class="input mono" type="number" [(ngModel)]="value" (ngModelChange)="convert()" />
          </label>
        </div>
        <div class="panel surface">
          <label class="field">
            <span class="field-label">To</span>
            <select class="select" [(ngModel)]="toId" (ngModelChange)="convert()">
              @for (u of units; track u.id) {
                <option [value]="u.id">{{ u.label }}</option>
              }
            </select>
          </label>
          <label class="field" style="margin-top:0.75rem">
            <span class="field-label">Result</span>
            <input class="input mono" [ngModel]="result" readonly />
          </label>
        </div>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-ghost" (click)="swap()">Swap units</button>
      </div>
    </app-tool-layout>
  `,
})
export class UnitConverterComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly cats = CATS;
  catId = 'length';
  units: UnitDef[] = CATS[0].units;
  fromId = 'm';
  toId = 'ft';
  value = 1;
  result = '';

  ngOnInit(): void {
    this.convert();
  }

  onCat(): void {
    const cat = CATS.find((c) => c.id === this.catId)!;
    this.units = cat.units;
    this.fromId = cat.units[0].id;
    this.toId = cat.units[1]?.id || cat.units[0].id;
    this.convert();
  }

  swap(): void {
    [this.fromId, this.toId] = [this.toId, this.fromId];
    this.convert();
  }

  convert(): void {
    if (this.catId === 'temp') {
      this.result = String(this.convertTemp(this.value, this.fromId, this.toId));
      return;
    }
    const from = this.units.find((u) => u.id === this.fromId);
    const to = this.units.find((u) => u.id === this.toId);
    if (!from || !to) return;
    const base = this.value * from.toBase;
    const out = base / to.toBase;
    this.result = Number.isFinite(out) ? String(+out.toPrecision(12)) : '';
  }

  private convertTemp(v: number, from: string, to: string): number {
    let c = v;
    if (from === 'f') c = ((v - 32) * 5) / 9;
    if (from === 'k') c = v - 273.15;
    if (to === 'c') return +c.toPrecision(12);
    if (to === 'f') return +((c * 9) / 5 + 32).toPrecision(12);
    return +(c + 273.15).toPrecision(12);
  }
}
