import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-url-encode',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="check"><input type="radio" name="mode" [value]="false" [(ngModel)]="componentMode" /> encodeURI (full URL safe-ish)</label>
        <label class="check"><input type="radio" name="mode" [value]="true" [(ngModel)]="componentMode" /> encodeURIComponent (query/path parts)</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="encode()">Encode</button>
        <button type="button" class="btn btn-primary" (click)="decode()">Decode</button>
        <button type="button" class="btn btn-ghost" (click)="swap()">Swap</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Input</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(input)">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="input" [appToolHistory]="tool.slug" placeholder="Text or encoded URL…"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Output</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(output)" [disabled]="!output">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="output" placeholder="Result…"></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
})
export class UrlEncodeComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  input = '';
  output = '';
  error = '';
  componentMode = true;

  encode(): void {
    this.error = '';
    try {
      this.output = this.componentMode ? encodeURIComponent(this.input) : encodeURI(this.input);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Encode failed';
    }
  }

  decode(): void {
    this.error = '';
    try {
      this.output = this.componentMode ? decodeURIComponent(this.input) : decodeURI(this.input);
    } catch {
      this.error = 'Invalid percent-encoding';
    }
  }

  swap(): void {
    [this.input, this.output] = [this.output, this.input];
  }

  sample(): void {
    this.input = 'https://utils.breejeshrathod.com/tools?q=hello world&emoji=✨';
    this.encode();
  }

  clear(): void {
    this.input = this.output = this.error = '';
  }
}
