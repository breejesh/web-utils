import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

@Component({
  selector: 'app-hash-generator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:180px">
          <span class="field-label">Algorithm</span>
          <select class="select" [(ngModel)]="algo" (ngModelChange)="hash()">
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
        </label>
        <label class="check"><input type="checkbox" [(ngModel)]="uppercase" (ngModelChange)="hash()" /> Uppercase hex</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="hash()">Hash</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Input</h3>
        </div>
        <textarea class="textarea" [(ngModel)]="input" [appToolHistory]="tool.slug" rows="8" placeholder="Text to hash…" (ngModelChange)="hash()"></textarea>
      </div>
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Digest (hex)</h3>
          <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(output)" [disabled]="!output">Copy</button>
        </div>
        <textarea class="textarea" [ngModel]="output" readonly rows="4" placeholder="Hash appears here…"></textarea>
      </div>
    </app-tool-layout>
  `,
})
export class HashGeneratorComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  input = '';
  output = '';
  error = '';
  algo: Algo = 'SHA-256';
  uppercase = false;

  async hash(): Promise<void> {
    this.error = '';
    if (!this.input) {
      this.output = '';
      return;
    }
    try {
      if (!globalThis.crypto?.subtle) {
        this.error = 'Web Crypto is not available in this environment';
        return;
      }
      const data = new TextEncoder().encode(this.input);
      const dig = await crypto.subtle.digest(this.algo, data);
      const hex = [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, '0')).join('');
      this.output = this.uppercase ? hex.toUpperCase() : hex;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Hash failed';
    }
  }

  sample(): void {
    this.input = 'Web Utils privacy-first hashing';
    void this.hash();
  }

  clear(): void {
    this.input = this.output = this.error = '';
  }
}
