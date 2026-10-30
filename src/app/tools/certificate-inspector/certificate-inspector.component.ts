import { DatePipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';
import { ParsedCertificate, colonHex, parseCertificate, pemBlocks } from '../../shared/utils/x509';

interface CertView {
  cert: ParsedCertificate;
  title: string;
  sha256: string;
  sha1: string;
  daysLeft: number;
  state: 'valid' | 'expiring' | 'expired' | 'future';
}

/** Demo leaf certificate (P-256, signed by a throwaway "Web Utils Demo Root CA"; valid until 2036). */
const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIICaDCCAe6gAwIBAgIUVtQbm55Vltm4mYmoadgkhaxOHCkwCgYIKoZIzj0EAwIw
RzELMAkGA1UEBhMCSU4xFzAVBgNVBAoMDldlYiBVdGlscyBEZW1vMR8wHQYDVQQD
DBZXZWIgVXRpbHMgRGVtbyBSb290IENBMB4XDTI2MTAyNjA2MTcxOFoXDTM2MTAy
MzA2MTcxOFowQzELMAkGA1UEBhMCSU4xFzAVBgNVBAoMDldlYiBVdGlscyBEZW1v
MRswGQYDVQQDDBJkZW1vLnV0aWxzLmV4YW1wbGUwWTATBgcqhkjOPQIBBggqhkjO
PQMBBwNCAAQKKErf10JwVegPCdgmxnIhChMwPDkRjJDvmKfrmgMknF3VTOrAqh8m
rk9baNXCbVFOSloqD9nk05/Ot5wxk3COo4G7MIG4MDkGA1UdEQQyMDCCEmRlbW8u
dXRpbHMuZXhhbXBsZYIUKi5kZW1vLnV0aWxzLmV4YW1wbGWHBMAAAgowDgYDVR0P
AQH/BAQDAgeAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAMBgNVHRMB
Af8EAjAAMB0GA1UdDgQWBBR0pMo8alvm+bbZtNt4Kn/PQJhgwzAfBgNVHSMEGDAW
gBS3bZ2R7wMC+Bbpq8tTcYwFBBkeTzAKBggqhkjOPQQDAgNoADBlAjEA09WdCzY+
C38ISiABga8p0W9vkX6VHyL6DKezrJEQ9fU7WPqH1yFAZJfvLb0OrshJAjAKSFOw
NB52BBPtAxuvNw3RRIR6Oqgex1Z4/sHE1R/dYuw71rKPwk8fwnvJewYZwi4=
-----END CERTIFICATE-----`;

@Component({
  selector: 'app-certificate-inspector',
  standalone: true,
  imports: [FormsModule, DatePipe, ToolLayoutComponent, IconComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="panel surface">
        <div class="panel-head">
          <h3 class="panel-title">PEM certificate or chain</h3>
          <div class="panel-actions">
            <label class="btn btn-quiet btn-sm file-btn">
              <svg appIcon="arrow-up"></svg> Open .pem / .crt
              <input type="file" hidden accept=".pem,.crt,.cer,.txt" (change)="onFile($event)" />
            </label>
            <button type="button" class="btn btn-quiet btn-sm" (click)="sample()"><svg appIcon="sparkles"></svg> Sample</button>
            <button type="button" class="btn btn-quiet btn-sm" (click)="clear()"><svg appIcon="trash"></svg> Clear</button>
          </div>
        </div>
        <textarea
          class="textarea"
          rows="7"
          [(ngModel)]="pem"
          [appToolHistory]="tool.slug"
          historyField="pem"
          (ngModelChange)="inspect()"
          placeholder="-----BEGIN CERTIFICATE-----&#10;MIID…&#10;-----END CERTIFICATE-----"
          spellcheck="false"></textarea>
        <p class="hint">
          Get one with <code class="mono">openssl s_client -connect example.com:443 -showcerts &lt;/dev/null</code>, or export it from
          your browser’s padlock menu.
        </p>
      </div>

      @if (error) {
        <div class="error-box">{{ error }}</div>
      }
      @if (privateKeyWarning) {
        <div class="error-box">
          This contains a PRIVATE KEY. It was not uploaded anywhere, but never paste private keys into websites. Rotate it if you
          pasted it somewhere else.
        </div>
      }

      @for (v of views; track $index) {
        <section class="cert surface" [attr.aria-label]="v.title">
          <header class="cert-head">
            <span class="cert-icon" [class.bad]="v.state === 'expired'"><svg appIcon="badge-check" [size]="20"></svg></span>
            <div class="cert-title">
              <h3>{{ v.title }}</h3>
              <p>
                @if (views.length > 1) {
                  <span>{{ $index === 0 ? 'Leaf' : v.cert.isCA ? 'Intermediate / CA' : 'Certificate' }} · </span>
                }
                Issued by {{ issuerTitle(v.cert) }}
              </p>
            </div>
            <span
              class="chip"
              [class.chip-accent]="v.state === 'valid'"
              [class.chip-warning]="v.state === 'expiring' || v.state === 'future'"
              [class.chip-danger]="v.state === 'expired'">
              @switch (v.state) {
                @case ('expired') { Expired {{ -v.daysLeft }} days ago }
                @case ('future') { Not valid yet }
                @default { {{ v.daysLeft }} days left }
              }
            </span>
          </header>

          <div class="validity" aria-hidden="true">
            <span [style.width.%]="progress(v)" [class.bad]="v.state === 'expired'" [class.warn]="v.state === 'expiring'"></span>
          </div>

          <dl class="fields">
            <div><dt>Subject</dt><dd class="mono">{{ v.cert.subjectString || '—' }}</dd></div>
            <div><dt>Issuer</dt><dd class="mono">{{ v.cert.issuerString || '—' }}{{ v.cert.selfSigned ? ' (self-signed)' : '' }}</dd></div>
            <div><dt>Valid from</dt><dd>{{ v.cert.notBefore | date: 'medium' }}</dd></div>
            <div><dt>Valid until</dt><dd>{{ v.cert.notAfter | date: 'medium' }}</dd></div>
            @if (v.cert.sans.length) {
              <div class="wide">
                <dt>Alternative names ({{ v.cert.sans.length }})</dt>
                <dd class="sans">
                  @for (s of v.cert.sans; track s) {
                    <span class="chip">{{ s }}</span>
                  }
                </dd>
              </div>
            }
            <div>
              <dt>Public key</dt>
              <dd>{{ v.cert.keyAlgorithm }}{{ v.cert.curve ? ' ' + v.cert.curve : '' }}{{ v.cert.keySize ? ' · ' + v.cert.keySize + ' bits' : '' }}</dd>
            </div>
            <div><dt>Signature</dt><dd>{{ v.cert.signatureAlgorithm }}</dd></div>
            <div><dt>Serial number</dt><dd class="mono">{{ v.cert.serialHex }}</dd></div>
            <div><dt>Version</dt><dd>v{{ v.cert.version }}{{ v.cert.isCA ? ' · CA certificate' : '' }}</dd></div>
            @if (v.cert.extKeyUsage.length) {
              <div><dt>Extended key usage</dt><dd>{{ v.cert.extKeyUsage.join(', ') }}</dd></div>
            }
            @if (v.cert.keyUsage.length) {
              <div><dt>Key usage</dt><dd>{{ v.cert.keyUsage.join(', ') }}</dd></div>
            }
            <div class="wide">
              <dt>SHA-256 fingerprint</dt>
              <dd class="fp">
                <span class="mono">{{ v.sha256 }}</span>
                <button type="button" class="btn btn-quiet btn-sm btn-icon" (click)="clip.copy(v.sha256)" aria-label="Copy SHA-256 fingerprint">
                  <svg appIcon="copy"></svg>
                </button>
              </dd>
            </div>
            <div class="wide"><dt>SHA-1 fingerprint</dt><dd class="mono">{{ v.sha1 }}</dd></div>
          </dl>

          @if (v.cert.extensions.length) {
            <details class="exts">
              <summary>Extensions ({{ v.cert.extensions.length }})</summary>
              <dl class="fields">
                @for (e of v.cert.extensions; track e.oid) {
                  <div class="wide">
                    <dt>{{ e.name }}{{ e.critical ? ' · critical' : '' }}</dt>
                    <dd class="mono">{{ e.value || '—' }}</dd>
                  </div>
                }
              </dl>
            </details>
          }
        </section>
      }
    </app-tool-layout>
  `,
  styles: [
    `
      code {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .cert {
        padding: 1.1rem 1.15rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
      }
      .cert-head {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex-wrap: wrap;
      }
      .cert-icon {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-md);
        color: var(--accent-color);
        background: var(--accent-opacity);
        flex-shrink: 0;
      }
      .cert-icon.bad {
        color: var(--danger);
        background: var(--danger-opacity);
      }
      .cert-title {
        flex: 1;
        min-width: 0;
      }
      .cert-title h3 {
        margin: 0;
        font-size: 1.05rem;
        overflow-wrap: anywhere;
      }
      .cert-title p {
        margin: 0.1rem 0 0;
        font-size: 13px;
        color: var(--text-muted);
      }
      .validity {
        height: 4px;
        border-radius: 999px;
        background: var(--bg-active);
        overflow: hidden;
      }
      .validity span {
        display: block;
        height: 100%;
        background: var(--accent-color);
      }
      .validity span.warn {
        background: var(--warning);
      }
      .validity span.bad {
        background: var(--danger);
      }
      .fields {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.85rem 1.5rem;
      }
      .fields .wide {
        grid-column: 1 / -1;
      }
      dt {
        font-size: 12px;
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: 0.15rem;
      }
      dd {
        margin: 0;
        color: var(--text-primary);
        font-size: 13.5px;
        overflow-wrap: anywhere;
      }
      dd.mono {
        font-size: 12.5px;
      }
      .sans {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .fp {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 12.5px;
      }
      .exts summary {
        cursor: pointer;
        font-size: 13px;
        font-weight: 550;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
      }
    `,
  ],
})
export class CertificateInspectorComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  pem = '';
  error = '';
  privateKeyWarning = false;
  views: CertView[] = [];
  private seq = 0;

  async inspect(): Promise<void> {
    const seq = ++this.seq;
    this.error = '';
    this.privateKeyWarning = /PRIVATE KEY-----/.test(this.pem);
    if (!this.pem.trim()) {
      this.views = [];
      return;
    }
    const blocks = pemBlocks(this.pem).filter((b) => b.type === 'CERTIFICATE' || b.type === 'TRUSTED CERTIFICATE');
    if (!blocks.length) {
      this.views = [];
      if (!this.privateKeyWarning) this.error = 'No certificate found. Expected -----BEGIN CERTIFICATE----- … -----END CERTIFICATE-----';
      return;
    }
    const views: CertView[] = [];
    for (const [i, b] of blocks.entries()) {
      if (!b.der) {
        this.error = `Certificate ${i + 1}: the Base64 body is invalid`;
        continue;
      }
      try {
        const cert = parseCertificate(b.der);
        const [sha256, sha1] = await Promise.all([digest('SHA-256', cert.der), digest('SHA-1', cert.der)]);
        const now = Date.now();
        const daysLeft = Math.floor((cert.notAfter.getTime() - now) / 86_400_000);
        const state = now < cert.notBefore.getTime() ? 'future' : daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'valid';
        const cn = cert.subject.find((a) => a.key === 'CN')?.value;
        views.push({ cert, title: cn || cert.sans[0] || cert.subjectString || 'Certificate', sha256, sha1, daysLeft, state });
      } catch (e) {
        this.error = `Certificate ${i + 1}: ${e instanceof Error ? e.message : 'could not be parsed'}`;
      }
    }
    if (seq === this.seq) this.views = views;
  }

  issuerTitle(c: ParsedCertificate): string {
    if (c.selfSigned) return 'itself (self-signed)';
    return c.issuer.find((a) => a.key === 'CN')?.value || c.issuer.find((a) => a.key === 'O')?.value || c.issuerString;
  }

  progress(v: CertView): number {
    const start = v.cert.notBefore.getTime();
    const total = v.cert.notAfter.getTime() - start;
    if (total <= 0) return 100;
    return Math.max(0, Math.min(100, ((Date.now() - start) / total) * 100));
  }

  async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const buf = new Uint8Array(await file.arrayBuffer());
    const text = new TextDecoder().decode(buf);
    if (text.includes('-----BEGIN')) {
      this.pem = text;
    } else {
      // Binary DER (.cer/.crt) → wrap as PEM.
      let bin = '';
      buf.forEach((b) => (bin += String.fromCharCode(b)));
      this.pem = `-----BEGIN CERTIFICATE-----\n${btoa(bin).match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
    }
    void this.inspect();
  }

  sample(): void {
    this.pem = SAMPLE_PEM;
    void this.inspect();
  }

  clear(): void {
    this.seq++;
    this.pem = this.error = '';
    this.privateKeyWarning = false;
    this.views = [];
  }
}

async function digest(algo: 'SHA-256' | 'SHA-1', der: Uint8Array): Promise<string> {
  return colonHex(new Uint8Array(await crypto.subtle.digest(algo, der)));
}
