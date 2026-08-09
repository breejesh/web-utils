import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

const WORDS = (
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
  'ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure ' +
  'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident'
).split(' ');

@Component({
  selector: 'app-lorem-ipsum',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:160px">
          <span class="field-label">Type</span>
          <select class="select" [(ngModel)]="mode" (ngModelChange)="generate()">
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </label>
        <label class="field" style="max-width:120px">
          <span class="field-label">Count</span>
          <input class="input" type="number" min="1" max="50" [(ngModel)]="count" (ngModelChange)="generate()" />
        </label>
        <label class="check"><input type="checkbox" [(ngModel)]="startWithLorem" (ngModelChange)="generate()" /> Start with “Lorem ipsum”</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="generate()">Generate</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(output)" [disabled]="!output">Copy</button>
      </div>
      <div class="panel surface">
        <textarea class="textarea" [(ngModel)]="output" rows="14"></textarea>
      </div>
    </app-tool-layout>
  `,
})
export class LoremIpsumComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  mode: 'paragraphs' | 'sentences' | 'words' = 'paragraphs';
  count = 3;
  startWithLorem = true;
  output = '';

  ngOnInit(): void {
    this.generate();
  }

  generate(): void {
    const n = Math.min(50, Math.max(1, Number(this.count) || 1));
    if (this.mode === 'words') {
      this.output = this.words(n, true);
      return;
    }
    if (this.mode === 'sentences') {
      this.output = Array.from({ length: n }, (_, i) => this.sentence(i === 0)).join(' ');
      return;
    }
    this.output = Array.from({ length: n }, (_, i) => {
      const sents = 3 + Math.floor(Math.random() * 3);
      return Array.from({ length: sents }, (__, j) => this.sentence(i === 0 && j === 0)).join(' ');
    }).join('\n\n');
  }

  private sentence(first: boolean): string {
    const len = 8 + Math.floor(Math.random() * 10);
    let s = this.words(len, first);
    s = s.charAt(0).toUpperCase() + s.slice(1) + '.';
    return s;
  }

  private words(n: number, first: boolean): string {
    const out: string[] = [];
    if (first && this.startWithLorem) {
      out.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
    }
    while (out.length < n) {
      out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }
    return out.slice(0, n).join(' ');
  }
}
