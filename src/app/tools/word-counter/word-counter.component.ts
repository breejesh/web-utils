import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-word-counter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="stat-grid">
        <div class="stat"><span class="k">Words</span><span class="v">{{ words }}</span></div>
        <div class="stat"><span class="k">Characters</span><span class="v">{{ chars }}</span></div>
        <div class="stat"><span class="k">No spaces</span><span class="v">{{ charsNoSpace }}</span></div>
        <div class="stat"><span class="k">Sentences</span><span class="v">{{ sentences }}</span></div>
        <div class="stat"><span class="k">Paragraphs</span><span class="v">{{ paragraphs }}</span></div>
        <div class="stat"><span class="k">Reading</span><span class="v" style="font-size:1rem">{{ reading }}</span></div>
      </div>
      <div class="panel surface" style="margin-top:1rem">
        <div class="panel-head">
          <h3 class="panel-title">Text</h3>
          <button type="button" class="btn btn-danger btn-sm" (click)="text = ''; update()">Clear</button>
        </div>
        <textarea class="textarea fill" [(ngModel)]="text" [appToolHistory]="tool.slug" historyField="text" (ngModelChange)="update()" placeholder="Paste or type…" style="min-height: var(--workspace-height)"></textarea>
      </div>
    </app-tool-layout>
  `,
})
export class WordCounterComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  text = '';
  words = 0;
  chars = 0;
  charsNoSpace = 0;
  sentences = 0;
  paragraphs = 0;
  reading = '0 min';

  update(): void {
    const t = this.text;
    this.chars = t.length;
    this.charsNoSpace = t.replace(/\s/g, '').length;
    const w = t.trim() ? t.trim().split(/\s+/).length : 0;
    this.words = w;
    this.sentences = t.trim() ? (t.match(/[.!?]+(\s|$)/g) || []).length || 1 : 0;
    this.paragraphs = t.trim() ? t.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
    const mins = w / 200;
    this.reading = mins < 1 ? `${Math.max(1, Math.round(mins * 60))} sec` : `${mins.toFixed(1)} min`;
  }
}
