import { isPlatformBrowser } from '@angular/common';
import { Component, Input, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToastService } from '../../core/services/toast.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { EvtxEvent, EvtxParseResult, parseEvtx } from '../../shared/utils/evtx-parser';
import { downloadText } from '../../shared/utils/download';

@Component({
  selector: 'app-evtx-viewer',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  templateUrl: './evtx-viewer.component.html',
  styleUrl: './evtx-viewer.component.scss',
})
export class EvtxViewerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  result: EvtxParseResult | null = null;
  error = '';
  fileName = '';
  filter = '';
  eventIdFilter = '';
  selected: EvtxEvent | null = null;
  maxEvents = 2000;
  loading = false;

  get filtered(): EvtxEvent[] {
    if (!this.result) return [];
    const q = this.filter.trim().toLowerCase();
    const id = this.eventIdFilter.trim();
    return this.result.events.filter((e) => {
      if (id && e.eventId !== id) return false;
      if (!q) return true;
      const hay = [e.provider, e.channel, e.computer, e.messagePreview, e.level, e.eventId, e.timestampIso, ...e.rawStrings]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  async onFile(ev: Event): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.loading = true;
    this.error = '';
    this.selected = null;
    this.result = null;
    this.fileName = file.name;
    try {
      const buf = await file.arrayBuffer();
      this.result = parseEvtx(buf, { maxEvents: this.maxEvents });
      this.toast.success(`Parsed ${this.result.events.length} event(s) locally`);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse EVTX';
    } finally {
      this.loading = false;
      (ev.target as HTMLInputElement).value = '';
    }
  }

  select(e: EvtxEvent): void {
    this.selected = e;
  }

  exportJson(): void {
    if (!this.result) return;
    const payload = {
      file: this.fileName,
      meta: {
        chunkCount: this.result.chunkCount,
        dirty: this.result.dirty,
        version: `${this.result.majorVersion}.${this.result.minorVersion}`,
        fileSize: this.result.fileSize,
      },
      events: this.filtered.map((e) => ({
        recordId: e.recordId,
        timestamp: e.timestampIso,
        eventId: e.eventId,
        level: e.level,
        provider: e.provider,
        channel: e.channel,
        computer: e.computer,
        preview: e.messagePreview,
        strings: e.rawStrings,
      })),
    };
    downloadText(
      (this.fileName || 'events').replace(/\.evtx$/i, '') + '-export.json',
      JSON.stringify(payload, null, 2),
      'application/json'
    );
  }

  exportCsv(): void {
    if (!this.result) return;
    const rows = this.filtered;
    const header = ['recordId', 'timestamp', 'eventId', 'level', 'provider', 'channel', 'computer', 'preview'];
    const lines = [header.join(',')];
    for (const e of rows) {
      lines.push(
        [
          e.recordId,
          e.timestampIso,
          e.eventId,
          e.level,
          e.provider,
          e.channel,
          e.computer,
          e.messagePreview,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      );
    }
    downloadText((this.fileName || 'events').replace(/\.evtx$/i, '') + '-export.csv', lines.join('\n'), 'text/csv');
  }

  clear(): void {
    this.result = null;
    this.selected = null;
    this.error = '';
    this.fileName = '';
    this.filter = '';
    this.eventIdFilter = '';
  }
}
