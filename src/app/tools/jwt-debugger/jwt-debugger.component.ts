import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-jwt-debugger',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="decode()">Decode</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      @if (expInfo) {
        <div class="meta-row">
          <span class="chip" [class.chip-accent]="!expired">{{ expInfo }}</span>
        </div>
      }
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Token</h3>
          <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(token)">Copy</button>
        </div>
        <textarea class="textarea" [(ngModel)]="token" [appToolHistory]="tool.slug" historyField="token" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (ngModelChange)="decode()" style="min-height:100px;resize:vertical"></textarea>
      </div>
      <div class="workspace-fill grid-2" style="min-height:min(40dvh,420px);height:min(40dvh,420px)">
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Header</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(header)" [disabled]="!header">Copy</button>
          </div>
          <textarea class="textarea fill" [ngModel]="header" readonly></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">Payload</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(payload)" [disabled]="!payload">Copy</button>
          </div>
          <textarea class="textarea fill" [ngModel]="payload" readonly></textarea>
        </div>
      </div>
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">Signature (not verified)</h3>
        </div>
        <textarea class="textarea" [ngModel]="signature" readonly rows="3" placeholder="Signature segment…"></textarea>
        <p class="note mono">Signature verification is intentionally not sent to any server. Treat tokens as secrets.</p>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .note {
        margin: 0.5rem 0 0;
        font-size: 12px;
        color: var(--text-muted);
      }
    `,
  ],
})
export class JwtDebuggerComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  token = '';
  header = '';
  payload = '';
  signature = '';
  error = '';
  expInfo = '';
  expired = false;

  decode(): void {
    this.error = '';
    this.header = this.payload = this.signature = this.expInfo = '';
    this.expired = false;
    const raw = this.token.trim();
    if (!raw) return;
    const parts = raw.split('.');
    if (parts.length < 2) {
      this.error = 'JWT must have at least header and payload segments';
      return;
    }
    try {
      const h = this.b64urlJson(parts[0]);
      const p = this.b64urlJson(parts[1]);
      this.header = JSON.stringify(h, null, 2);
      this.payload = JSON.stringify(p, null, 2);
      this.signature = parts[2] || '(none)';
      if (typeof p['exp'] === 'number') {
        const exp = p['exp'] * 1000;
        const d = new Date(exp);
        this.expired = Date.now() > exp;
        this.expInfo = this.expired
          ? `Expired ${d.toISOString()}`
          : `Expires ${d.toISOString()}`;
      }
    } catch {
      this.error = 'Could not decode JWT segments (invalid Base64URL or JSON)';
    }
  }

  private b64urlJson(seg: string): Record<string, unknown> {
    let b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(
      Array.from(atob(b64), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(json);
  }

  sample(): void {
    // Header {alg:HS256,typ:JWT} payload {sub:123,name:Web Utils,iat:1516239022,exp:4102444800}
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IldlYiBVdGlscyIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature-placeholder';
    this.decode();
  }

  clear(): void {
    this.token = this.header = this.payload = this.signature = this.error = this.expInfo = '';
  }
}
