import { isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="options surface">
        <label class="field" style="max-width:140px">
          <span class="field-label">Length</span>
          <input class="input" type="number" min="4" max="128" [(ngModel)]="length" />
        </label>
        <label class="check"><input type="checkbox" [(ngModel)]="lower" /> a-z</label>
        <label class="check"><input type="checkbox" [(ngModel)]="upper" /> A-Z</label>
        <label class="check"><input type="checkbox" [(ngModel)]="digits" /> 0-9</label>
        <label class="check"><input type="checkbox" [(ngModel)]="symbols" /> Symbols</label>
        <label class="check"><input type="checkbox" [(ngModel)]="excludeAmbiguous" /> Exclude ambiguous</label>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="generate()">Generate</button>
        <button type="button" class="btn btn-ghost" (click)="clip.copy(password)" [disabled]="!password">Copy</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="panel surface">
        <div class="panel-head"><h3 class="panel-title">Password</h3></div>
        <input class="input mono big" [ngModel]="password" readonly />
        <div class="meta-row" style="margin-top:0.75rem">
          <span class="chip" [class.chip-accent]="strength !== 'Weak'">Strength: {{ strength }}</span>
          <span class="chip">~{{ entropy }} bits</span>
        </div>
      </div>
    </app-tool-layout>
  `,
  styles: [
    `
      .big {
        font-size: 1.15rem;
        letter-spacing: 0.04em;
        padding: 1rem 1.1rem;
      }
    `,
  ],
})
export class PasswordGeneratorComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  length = 20;
  lower = true;
  upper = true;
  digits = true;
  symbols = true;
  excludeAmbiguous = true;
  password = '';
  error = '';
  strength = '—';
  entropy = 0;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.generate();
    }
  }

  generate(): void {
    this.error = '';
    let pool = '';
    if (this.lower) pool += this.excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    if (this.upper) pool += this.excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (this.digits) pool += this.excludeAmbiguous ? '23456789' : '0123456789';
    if (this.symbols) pool += this.excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()-_=+[]{};:,.?';
    if (!pool) {
      this.error = 'Select at least one character set';
      this.password = '';
      return;
    }
    const len = Math.min(128, Math.max(4, Number(this.length) || 16));
    const bytes = new Uint8Array(len);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let out = '';
    for (let i = 0; i < len; i++) out += pool[bytes[i] % pool.length];
    this.password = out;
    this.entropy = Math.floor(len * Math.log2(pool.length));
    this.strength = this.entropy < 50 ? 'Weak' : this.entropy < 80 ? 'Good' : 'Strong';
  }
}
