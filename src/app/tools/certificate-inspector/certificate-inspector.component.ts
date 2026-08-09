import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-certificate-inspector',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="inspect()">Inspect</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample structure</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">PEM</h3></div>
        <textarea class="textarea" [(ngModel)]="pem" [appToolHistory]="tool.slug" historyField="pem" rows="12" placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"></textarea>
      </div>
      @if (info) {
        <div class="stat-grid">
          <div class="stat"><span class="k">Type</span><span class="v" style="font-size:1rem">{{ info.type }}</span></div>
          <div class="stat"><span class="k">Blocks</span><span class="v">{{ info.blocks }}</span></div>
          <div class="stat"><span class="k">Base64 size</span><span class="v" style="font-size:1rem">{{ info.bytes }} B</span></div>
        </div>
      }
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Decoded notes</h3>
          <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(notes)" [disabled]="!notes">Copy</button>
        </div>
        <textarea class="textarea" [ngModel]="notes" readonly rows="10" placeholder="Inspection notes…"></textarea>
        <p class="note mono">Educational PEM inspection only. Full X.509 field parsing is limited without native ASN.1 APIs; use for structure checks and privacy-safe local review.</p>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .note {
        margin: 0.65rem 0 0;
        font-size: 12px;
        color: var(--text-muted);
      }
    `,
  ],
})
export class CertificateInspectorComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  pem = '';
  notes = '';
  error = '';
  info: { type: string; blocks: number; bytes: number } | null = null;

  inspect(): void {
    this.error = '';
    this.notes = '';
    this.info = null;
    const blocks = [...this.pem.matchAll(/-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/g)];
    if (!blocks.length) {
      this.error = 'No PEM blocks found (expected BEGIN/END markers)';
      return;
    }
    const lines: string[] = [];
    let total = 0;
    blocks.forEach((m, i) => {
      const type = m[1].trim();
      const body = m[2].replace(/\s+/g, '');
      total += body.length;
      let decodedLen = 0;
      try {
        decodedLen = atob(body).length;
      } catch {
        lines.push(`Block ${i + 1}: ${type} — invalid Base64 body`);
        return;
      }
      lines.push(`Block ${i + 1}: ${type}`);
      lines.push(`  Base64 chars: ${body.length}`);
      lines.push(`  Decoded DER bytes: ${decodedLen}`);
      lines.push(`  Note: ASN.1 fields (issuer, SAN, dates) require a full DER parser; structure looks ${decodedLen > 0 ? 'valid' : 'empty'}.`);
      lines.push('');
    });
    this.info = {
      type: blocks[0][1].trim(),
      blocks: blocks.length,
      bytes: Math.floor((total * 3) / 4),
    };
    this.notes = lines.join('\n').trim();
  }

  sample(): void {
    // Tiny fake PEM-shaped sample (not a real cert) for UI demo of structure detection
    const fake = btoa('WEB-UTILS-DEMO-NOT-A-REAL-CERTIFICATE');
    this.pem = `-----BEGIN CERTIFICATE-----\n${fake.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
    this.inspect();
  }

  clear(): void {
    this.pem = this.notes = this.error = '';
    this.info = null;
  }
}
