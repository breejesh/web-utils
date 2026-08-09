import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <button type="button" class="btn btn-ghost btn-sm" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(html)" [disabled]="!html">Copy HTML</button>
        <button type="button" class="btn btn-danger btn-sm" (click)="md = ''; render()">Clear</button>
      </div>

      <div class="workspace-fill grid-2 md-workspace">
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Markdown</h3>
            <span class="meta-row">{{ md.length }} chars</span>
          </div>
          <textarea
            class="textarea fill"
            [(ngModel)]="md"
            [appToolHistory]="tool.slug"
            historyField="md"
            (ngModelChange)="render()"
            placeholder="# Hello"
            spellcheck="false"
          ></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Preview</h3>
          </div>
          <div class="scroll-pane md-preview" [innerHTML]="safeHtml"></div>
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
        width: 100%;
      }

      .md-workspace {
        /* slightly taller for this tool */
        min-height: clamp(360px, calc(100dvh - var(--header-height) - 200px), 960px);
        height: clamp(360px, calc(100dvh - var(--header-height) - 200px), 960px);
      }

      .md-preview {
        padding: 0.35rem 0.15rem 0.75rem;
        border-radius: var(--radius-md);
      }

      @media (max-width: 900px) {
        .md-workspace {
          height: auto;
          min-height: 0;
        }
      }
    `,
  ],
})
export class MarkdownPreviewComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly sanitizer = inject(DomSanitizer);
  md = '';
  html = '';
  safeHtml: SafeHtml = '';

  constructor() {
    marked.setOptions({ gfm: true, breaks: true });
  }

  render(): void {
    const raw = marked.parse(this.md || '', { async: false }) as string;
    this.html = raw;
    this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  sample(): void {
    this.md = `# Web Utils

Privacy-first **client-side** tools.

| Tool | Use |
| --- | --- |
| Base64 | Encode |
| JSON | Format |
| JWT | Inspect |

- Base64
- JSON
- JWT

\`inline code\` and a [link](https://utils.breejeshrathod.com)

\`\`\`ts
const local = true;
\`\`\`

> Nothing leaves your browser.`;
    this.render();
  }
}
