import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { ToolDefinition } from '../../core/models/tool.model';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';
import { downloadDataUrl } from '../../shared/utils/download';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:140px">
          <span class="field-label">Size</span>
          <input class="input" type="number" min="128" max="1024" step="32" [(ngModel)]="size" />
        </label>
        <label class="field" style="max-width:140px">
          <span class="field-label">Margin</span>
          <input class="input" type="number" min="0" max="8" [(ngModel)]="margin" />
        </label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="generate()">Generate</button>
        <button type="button" class="btn btn-ghost" (click)="download()" [disabled]="!dataUrl">Download PNG</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="grid-2">
        <div class="panel surface">
          <div class="panel-head"><h3 class="panel-title">Content</h3></div>
          <textarea class="textarea" [(ngModel)]="text" [appToolHistory]="tool.slug" historyField="text" rows="10" placeholder="URL or text…"></textarea>
        </div>
        <div class="panel surface preview">
          <div class="panel-head"><h3 class="panel-title">QR preview</h3></div>
          @if (dataUrl) {
            <img [src]="dataUrl" alt="Generated QR code" width="256" height="256" />
          } @else {
            <p class="empty">Generate a QR code to preview it here.</p>
          }
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .preview {
        align-items: flex-start;
      }
      img {
        width: min(256px, 100%);
        height: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: #fff;
        padding: 0.5rem;
      }
      .empty {
        color: var(--text-muted);
      }
    `,
  ],
})
export class QrCodeComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);
  text = '';
  size = 256;
  margin = 2;
  dataUrl = '';
  error = '';

  async generate(): Promise<void> {
    this.error = '';
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.text.trim()) {
      this.error = 'Enter text or a URL';
      this.dataUrl = '';
      return;
    }
    try {
      this.dataUrl = await QRCode.toDataURL(this.text, {
        width: this.size,
        margin: this.margin,
        color: { dark: '#050505', light: '#ffffff' },
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'QR generation failed';
    }
  }

  download(): void {
    if (!this.dataUrl) return;
    downloadDataUrl('web-utils-qr.png', this.dataUrl);
    this.toast.success('Download started');
  }

  sample(): void {
    this.text = 'https://utils.breejeshrathod.com';
    void this.generate();
  }
}
