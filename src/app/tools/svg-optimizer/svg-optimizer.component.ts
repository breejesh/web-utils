import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-svg-optimizer',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="check"><input type="checkbox" [(ngModel)]="stripComments" /> Strip comments</label>
        <label class="check"><input type="checkbox" [(ngModel)]="collapseWs" /> Collapse whitespace</label>
        <label class="check"><input type="checkbox" [(ngModel)]="stripMetadata" /> Strip editor metadata</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="optimize()">Optimize</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(output)" [disabled]="!output">Copy</button>
      </div>
      @if (stats) {
        <div class="meta-row">
          <span class="chip">{{ stats }}</span>
        </div>
      }
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">SVG input</h3></div>
          <textarea class="textarea fill" [(ngModel)]="input" [appToolHistory]="tool.slug" placeholder="<svg …>"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head"><h3 class="panel-title">Optimized</h3></div>
          <textarea class="textarea fill" [(ngModel)]="output"></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
})
export class SvgOptimizerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  input = '';
  output = '';
  stripComments = true;
  collapseWs = true;
  stripMetadata = true;
  stats = '';

  optimize(): void {
    let s = this.input;
    const before = s.length;
    if (this.stripComments) s = s.replace(/<!--[\s\S]*?-->/g, '');
    if (this.stripMetadata) {
      s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
      s = s.replace(/\s(inkscape|sodipodi|xmlns:inkscape|xmlns:sodipodi):[^\s"'>]+(="[^"]*")?/gi, '');
      s = s.replace(/\sdata-name="[^"]*"/gi, '');
    }
    if (this.collapseWs) {
      s = s.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
    }
    this.output = s;
    const after = s.length;
    const saved = before ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
    this.stats = `${before} → ${after} chars (−${saved}%)`;
  }

  sample(): void {
    this.input = `<!-- editor -->\n<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" data-name="Layer 1">\n  <circle cx="50" cy="50" r="40" fill="#64ffda" />\n  <metadata>junk</metadata>\n</svg>`;
    this.optimize();
  }
}
