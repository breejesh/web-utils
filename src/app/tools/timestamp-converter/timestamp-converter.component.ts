import { isPlatformBrowser } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

type TsUnit = 's' | 'ms' | 'us' | 'ns';
type ClockFmt = '12' | '24';
type DateFmt = 'YMD' | 'MDY' | 'DMY';

const CODE_SNIPPETS: { lang: string; now: string; from: string }[] = [
  { lang: 'JavaScript', now: 'Math.floor(Date.now() / 1000)', from: 'new Date(EPOCH * 1000).toLocaleString()' },
  { lang: 'Python', now: 'import time; time.time()', from: 'import time; time.ctime(EPOCH)' },
  { lang: 'PHP', now: 'time()', from: "date('r', EPOCH);" },
  { lang: 'Java', now: 'System.currentTimeMillis()/1000', from: 'new java.util.Date(EPOCH*1000L)' },
  { lang: 'C#', now: 'DateTimeOffset.Now.ToUnixTimeSeconds()', from: 'DateTimeOffset.FromUnixTimeSeconds(EPOCH)' },
  { lang: 'Go', now: 'time.Now().Unix()', from: 'time.Unix(EPOCH, 0)' },
  { lang: 'Ruby', now: 'Time.now.to_i', from: 'Time.at(EPOCH)' },
  { lang: 'PostgreSQL', now: 'SELECT EXTRACT(EPOCH FROM now());', from: 'SELECT TO_TIMESTAMP(EPOCH);' },
  { lang: 'MySQL', now: 'SELECT UNIX_TIMESTAMP(NOW());', from: 'SELECT FROM_UNIXTIME(EPOCH);' },
  { lang: 'SQLite', now: 'SELECT unixepoch();', from: "SELECT datetime(EPOCH, 'unixepoch');" },
  { lang: 'Shell', now: 'date +%s', from: 'date -d @EPOCH' },
  { lang: 'PowerShell', now: '[DateTimeOffset]::Now.ToUnixTimeSeconds()', from: '[DateTimeOffset]::FromUnixTimeSeconds(EPOCH)' },
  {
    lang: 'Excel',
    now: '=(NOW()-DATE(1970,1,1))*86400',
    from: '=(A1/86400)+25569  (format cell as date; A1 = epoch seconds, UTC)',
  },
];

@Component({
  selector: 'app-timestamp-converter',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  templateUrl: './timestamp-converter.component.html',
  styleUrl: './timestamp-converter.component.scss',
})
export class TimestampConverterComponent implements OnInit, OnDestroy {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly snippets = CODE_SNIPPETS;

  // Live clock
  liveSec = '';
  liveMs = '';
  liveUs = '';
  liveNs = '';
  liveIso = '';
  liveLocal = '';

  // Timestamp → date
  tsInput = '';
  tsUnit: TsUnit | 'auto' = 'auto';
  useUtc = true;
  clockFmt: ClockFmt = '24';
  fromResultLines: string[] = [];
  tsError = '';

  // Date parts → timestamp
  yr = 0;
  mon = 1;
  day = 1;
  hr = 0;
  min = 0;
  sec = 0;
  ampm: 'AM' | 'PM' = 'AM';
  partsUtc = true;
  partsResult = '';

  // Free-form date string
  dateInput = '';
  dateResultLines: string[] = [];
  dateError = '';

  // Start/end of period
  periodMode: 'year' | 'month' | 'day' = 'day';
  pYr = 0;
  pMon = 1;
  pDay = 1;
  periodUtc = true;
  periodResult = '';

  // Seconds humanize
  humanSeconds = 86400;
  humanResult = '';

  // Reference table
  readonly refTable = [
    { label: '1 hour', sec: 3600 },
    { label: '1 day', sec: 86400 },
    { label: '1 week', sec: 604800 },
    { label: '1 month (~30.44 days)', sec: 2629743 },
    { label: '1 year (365.25 days)', sec: 31557600 },
  ];

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const n = new Date();
    this.yr = this.pYr = n.getUTCFullYear();
    this.mon = this.pMon = n.getUTCMonth() + 1;
    this.day = this.pDay = n.getUTCDate();
    this.hr = n.getUTCHours();
    this.min = n.getUTCMinutes();
    this.sec = n.getUTCSeconds();
    this.tick();
    this.useNowTs();
    this.fromParts();
    this.fromDateString();
    this.calcPeriod();
    this.humanize();
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.tick(), 250);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const ms = Date.now();
    this.liveSec = String(Math.floor(ms / 1000));
    this.liveMs = String(ms);
    this.liveUs = String(ms * 1000);
    this.liveNs = String(ms * 1_000_000);
    const d = new Date(ms);
    this.liveIso = d.toISOString();
    this.liveLocal = d.toString();
  }

  detectUnit(n: number): TsUnit {
    const abs = Math.abs(n);
    const digits = Math.floor(abs).toString().length;
    if (digits >= 19) return 'ns';
    if (digits >= 16) return 'us';
    if (digits >= 13) return 'ms';
    return 's';
  }

  private toMs(n: number, unit: TsUnit): number {
    switch (unit) {
      case 's':
        return n * 1000;
      case 'ms':
        return n;
      case 'us':
        return n / 1000;
      case 'ns':
        return n / 1_000_000;
    }
  }

  useNowTs(): void {
    this.tsInput = this.liveSec;
    this.tsUnit = 's';
    this.fromTimestamp();
  }

  fromTimestamp(): void {
    this.tsError = '';
    this.fromResultLines = [];
    const raw = this.tsInput.trim().replace(/,/g, '');
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      this.tsError = 'Enter a numeric Unix timestamp';
      return;
    }
    const unit = this.tsUnit === 'auto' ? this.detectUnit(n) : this.tsUnit;
    const ms = this.toMs(n, unit);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) {
      this.tsError = 'Invalid timestamp';
      return;
    }
    const sec = Math.floor(d.getTime() / 1000);
    this.fromResultLines = [
      `Detected unit: ${unit} (${this.unitLabel(unit)})`,
      `GMT / UTC: ${d.toUTCString()}`,
      `ISO 8601:  ${d.toISOString()}`,
      `Local:     ${d.toString()}`,
      `Locale:    ${d.toLocaleString()}`,
      `Relative:  ${this.relative(d)}`,
      `Unix s:    ${sec}`,
      `Unix ms:   ${d.getTime()}`,
      `Unix µs:   ${d.getTime() * 1000}`,
      `Day of year: ${this.dayOfYear(d)} · Week: ${this.weekNumber(d)}`,
      `Y2K38 risk: ${sec > 2147483647 ? 'Beyond signed 32-bit' : 'Within signed 32-bit range'}`,
    ];
  }

  private unitLabel(u: TsUnit): string {
    return { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' }[u];
  }

  fromParts(): void {
    let h = Number(this.hr) || 0;
    if (this.clockFmt === '12') {
      const ap = this.ampm;
      h = h % 12;
      if (ap === 'PM') h += 12;
    }
    const y = Number(this.yr);
    const m = Number(this.mon);
    const d = Number(this.day);
    const mi = Number(this.min) || 0;
    const s = Number(this.sec) || 0;
    let date: Date;
    if (this.partsUtc) {
      date = new Date(Date.UTC(y, m - 1, d, h, mi, s));
    } else {
      date = new Date(y, m - 1, d, h, mi, s);
    }
    if (Number.isNaN(date.getTime())) {
      this.partsResult = 'Invalid date parts';
      return;
    }
    const sec = Math.floor(date.getTime() / 1000);
    this.partsResult = [
      `Unix s:  ${sec}`,
      `Unix ms: ${date.getTime()}`,
      `UTC:     ${date.toISOString()}`,
      `Local:   ${date.toString()}`,
    ].join('\n');
  }

  fromDateString(): void {
    this.dateError = '';
    this.dateResultLines = [];
    if (!this.dateInput.trim()) {
      this.dateInput = new Date().toISOString();
    }
    let input = this.dateInput.trim();
    // Strip trailing GMT to force local parse if user wants — keep ISO as-is
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) {
      this.dateError = 'Could not parse. Try RFC 2822, ISO 8601, Y-M-D, M/D/Y, etc.';
      return;
    }
    this.dateResultLines = [
      `Unix s:  ${Math.floor(d.getTime() / 1000)}`,
      `Unix ms: ${d.getTime()}`,
      `UTC:     ${d.toUTCString()}`,
      `ISO:     ${d.toISOString()}`,
      `Local:   ${d.toString()}`,
    ];
  }

  calcPeriod(): void {
    const y = Number(this.pYr);
    const m = Number(this.pMon);
    const d = Number(this.pDay);
    let start: Date;
    let end: Date;
    if (this.periodMode === 'year') {
      start = this.periodUtc ? new Date(Date.UTC(y, 0, 1, 0, 0, 0)) : new Date(y, 0, 1, 0, 0, 0);
      end = this.periodUtc ? new Date(Date.UTC(y, 11, 31, 23, 59, 59)) : new Date(y, 11, 31, 23, 59, 59);
    } else if (this.periodMode === 'month') {
      start = this.periodUtc ? new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)) : new Date(y, m - 1, 1, 0, 0, 0);
      end = this.periodUtc
        ? new Date(Date.UTC(y, m, 0, 23, 59, 59))
        : new Date(y, m, 0, 23, 59, 59);
    } else {
      start = this.periodUtc ? new Date(Date.UTC(y, m - 1, d, 0, 0, 0)) : new Date(y, m - 1, d, 0, 0, 0);
      end = this.periodUtc ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59)) : new Date(y, m - 1, d, 23, 59, 59);
    }
    this.periodResult = [
      `Start: ${start.toISOString()}  →  ${Math.floor(start.getTime() / 1000)}`,
      `End:   ${end.toISOString()}  →  ${Math.floor(end.getTime() / 1000)}`,
    ].join('\n');
  }

  humanize(): void {
    let rem = Math.abs(Number(this.humanSeconds) || 0);
    const years = Math.floor(rem / 31557600);
    rem %= 31557600;
    const months = Math.floor(rem / 2629743);
    rem %= 2629743;
    const days = Math.floor(rem / 86400);
    rem %= 86400;
    const hours = Math.floor(rem / 3600);
    rem %= 3600;
    const mins = Math.floor(rem / 60);
    const secs = Math.floor(rem % 60);
    this.humanResult = `${years}y ${months}mo ${days}d ${hours}h ${mins}m ${secs}s`;
  }

  clearAll(): void {
    this.tsInput = '';
    this.fromResultLines = [];
    this.tsError = '';
    this.dateInput = '';
    this.dateResultLines = [];
    this.dateError = '';
    this.partsResult = '';
    this.periodResult = '';
  }

  private relative(d: Date): string {
    const diff = Date.now() - d.getTime();
    const sec = Math.round(Math.abs(diff) / 1000);
    const future = diff < 0;
    const fmt = (n: number, u: string) => `${n} ${u}${n === 1 ? '' : 's'} ${future ? 'from now' : 'ago'}`;
    if (sec < 60) return fmt(sec, 'second');
    if (sec < 3600) return fmt(Math.round(sec / 60), 'minute');
    if (sec < 86400) return fmt(Math.round(sec / 3600), 'hour');
    if (sec < 86400 * 45) return fmt(Math.round(sec / 86400), 'day');
    if (sec < 86400 * 365) return fmt(Math.round(sec / (86400 * 30.44)), 'month');
    return fmt(Math.round(sec / 31557600), 'year');
  }

  private dayOfYear(d: Date): number {
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return Math.floor((d.getTime() - start) / 86400000);
  }

  private weekNumber(d: Date): number {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
  }

  snippet(from: string): string {
    return from.replace(/EPOCH/g, this.liveSec || '1710000000');
  }
}
