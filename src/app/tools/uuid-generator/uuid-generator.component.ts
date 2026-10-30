import { isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-uuid-generator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, IconComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:220px">
          <span class="field-label">Type</span>
          <select class="select" [(ngModel)]="mode" (ngModelChange)="generate()">
            <option value="uuid">UUID v4 (random)</option>
            <option value="v7">UUID v7 (time-ordered)</option>
            <option value="nano">Nano-style ID</option>
          </select>
        </label>
        <label class="field" style="max-width:120px">
          <span class="field-label">Count</span>
          <input class="input" type="number" min="1" max="200" [(ngModel)]="count" />
        </label>
        @if (mode === 'nano') {
          <label class="field" style="max-width:120px">
            <span class="field-label">Length</span>
            <input class="input" type="number" min="6" max="64" [(ngModel)]="nanoLen" />
          </label>
        }
        <label class="check"><input type="checkbox" [(ngModel)]="uppercase" /> Uppercase</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="generate()">Generate</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(output)" [disabled]="!output"><svg appIcon="copy"></svg> Copy all</button>
        <button type="button" class="btn btn-quiet" (click)="output = ''"><svg appIcon="trash"></svg> Clear</button>
      </div>
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">IDs</h3></div>
        <textarea class="textarea" [(ngModel)]="output" rows="14" placeholder="Generated IDs…"></textarea>
      </div>
    </app-tool-layout>
  `,
})
export class UuidGeneratorComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  mode: 'uuid' | 'v7' | 'nano' = 'uuid';
  count = 5;
  nanoLen = 21;
  uppercase = false;
  output = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.generate();
    }
  }

  generate(): void {
    const n = Math.min(200, Math.max(1, Number(this.count) || 1));
    const lines: string[] = [];
    for (let i = 0; i < n; i++) {
      let id = this.mode === 'uuid' ? this.uuid() : this.mode === 'v7' ? this.uuidV7() : this.nano(this.nanoLen);
      if (this.uppercase) id = id.toUpperCase();
      lines.push(id);
    }
    this.output = lines.join('\n');
  }

  private uuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private lastMs = 0;
  private seqV7 = 0;

  /** RFC 9562 UUIDv7: 48-bit ms timestamp, then randomness; a 12-bit counter keeps same-ms IDs sorted. */
  private uuidV7(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const now = Date.now();
    if (now === this.lastMs) {
      this.seqV7 = (this.seqV7 + 1) & 0xfff;
    } else {
      this.lastMs = now;
      this.seqV7 = ((bytes[6] & 0x07) << 8) | bytes[7];
    }
    let ms = now;
    for (let i = 5; i >= 0; i--) {
      bytes[i] = ms % 256;
      ms = Math.floor(ms / 256);
    }
    bytes[6] = 0x70 | ((this.seqV7 >> 8) & 0x0f);
    bytes[7] = this.seqV7 & 0xff;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private nano(len: number): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    let id = '';
    for (let i = 0; i < len; i++) id += alphabet[bytes[i] % alphabet.length];
    return id;
  }
}
