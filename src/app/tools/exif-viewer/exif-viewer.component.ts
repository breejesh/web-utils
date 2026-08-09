import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import exifr from 'exifr';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { downloadDataUrl } from '../../shared/utils/download';

@Component({
  selector: 'app-exif-viewer',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <label class="btn btn-primary file-btn">
          Choose image
          <input type="file" accept="image/*" hidden (change)="onFile($event)" />
        </label>
        <button type="button" class="btn btn-ghost" (click)="strip()" [disabled]="!src">Strip & download</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(json)" [disabled]="!json">Copy JSON</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="grid-2">
        <div class="panel surface">
          <div class="panel-head"><h3 class="panel-title">Preview</h3></div>
          @if (src) {
            <img [src]="src" alt="Uploaded image preview" />
          } @else {
            <p class="empty">Select a photo to inspect EXIF/metadata locally.</p>
          }
          <div class="meta-row">{{ fileLabel }}</div>
        </div>
        <div class="panel surface">
          <div class="panel-head"><h3 class="panel-title">Metadata</h3></div>
          <textarea class="textarea" [ngModel]="json" readonly rows="16" placeholder="No metadata loaded"></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .file-btn {
        cursor: pointer;
      }
      img {
        max-width: 100%;
        max-height: 320px;
        object-fit: contain;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: var(--bg-input);
      }
      .empty {
        color: var(--text-muted);
      }
    `,
  ],
})
export class ExifViewerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);

  src = '';
  json = '';
  error = '';
  fileLabel = '';
  private fileName = 'image';

  async onFile(ev: Event): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error = '';
    this.fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
    this.fileLabel = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
    this.src = URL.createObjectURL(file);
    try {
      const data = await exifr.parse(file, { iptc: true, xmp: true, icc: false });
      this.json = data ? JSON.stringify(data, null, 2) : 'No EXIF/IPTC/XMP metadata found.';
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse metadata';
      this.json = '';
    }
    (ev.target as HTMLInputElement).value = '';
  }

  async strip(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.src) return;
    try {
      const img = await this.loadImage(this.src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/jpeg', 0.92);
      downloadDataUrl(`${this.fileName}-stripped.jpg`, url);
      this.toast.success('Stripped copy downloaded (re-encoded, metadata removed)');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Strip failed';
    }
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
