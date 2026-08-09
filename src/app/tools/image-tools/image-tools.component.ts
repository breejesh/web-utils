import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { downloadDataUrl } from '../../shared/utils/download';

@Component({
  selector: 'app-image-tools',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:140px">
          <span class="field-label">Max width</span>
          <input class="input" type="number" min="16" [(ngModel)]="maxWidth" />
        </label>
        <label class="field" style="max-width:140px">
          <span class="field-label">Quality</span>
          <input class="input" type="number" min="0.1" max="1" step="0.05" [(ngModel)]="quality" />
        </label>
        <label class="field" style="max-width:160px">
          <span class="field-label">Output</span>
          <select class="select" [(ngModel)]="mime">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
      </div>
      <div class="toolbar">
        <label class="btn btn-primary file-btn">
          Choose image
          <input type="file" accept="image/*" hidden (change)="onFile($event)" />
        </label>
        <button type="button" class="btn btn-ghost" (click)="process()" [disabled]="!src">Process</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(base64)" [disabled]="!base64">Copy Base64</button>
        <button type="button" class="btn btn-ghost" (click)="download()" [disabled]="!outUrl">Download</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="grid-2">
        <div class="panel surface">
          <div class="panel-head"><h3 class="panel-title">Original</h3></div>
          @if (src) { <img [src]="src" alt="Original upload preview" /> } @else { <p class="empty">No image selected</p> }
          @if (info) { <div class="meta-row">{{ info }}</div> }
        </div>
        <div class="panel surface">
          <div class="panel-head"><h3 class="panel-title">Output</h3></div>
          @if (outUrl) { <img [src]="outUrl" alt="Processed image preview" /> } @else { <p class="empty">Processed image appears here</p> }
          @if (outInfo) { <div class="meta-row">{{ outInfo }}</div> }
        </div>
      </div>
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">Base64 / data URL</h3></div>
        <textarea class="textarea" [ngModel]="base64" readonly rows="6" placeholder="data:image/…;base64,…"></textarea>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .file-btn { cursor: pointer; }
      img {
        max-width: 100%;
        max-height: 280px;
        object-fit: contain;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: var(--bg-input);
      }
      .empty { color: var(--text-muted); }
    `,
  ],
})
export class ImageToolsComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);

  src = '';
  outUrl = '';
  base64 = '';
  maxWidth = 1200;
  quality = 0.85;
  mime = 'image/jpeg';
  error = '';
  info = '';
  outInfo = '';
  private fileName = 'image';

  async onFile(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error = '';
    this.fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
    this.src = await this.readAsDataURL(file);
    this.info = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
    await this.process();
    (ev.target as HTMLInputElement).value = '';
  }

  async process(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.src) return;
    this.error = '';
    try {
      const img = await this.loadImage(this.src);
      const scale = Math.min(1, this.maxWidth / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0, w, h);
      this.outUrl = canvas.toDataURL(this.mime, this.quality);
      this.base64 = this.outUrl;
      const approx = Math.round((this.outUrl.length * 3) / 4 / 1024);
      this.outInfo = `${w}×${h} · ~${approx} KB (encoded)`;
      this.toast.success('Image processed locally');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Processing failed';
    }
  }

  download(): void {
    if (!this.outUrl) return;
    const ext = this.mime.split('/')[1] || 'png';
    downloadDataUrl(`${this.fileName}-web-utils.${ext}`, this.outUrl);
  }

  private readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = src;
    });
  }
}
