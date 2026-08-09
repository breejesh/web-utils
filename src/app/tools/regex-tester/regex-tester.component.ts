import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

export interface GroupInfo {
  num: number;
  name?: string;
  value: string;
  start: number;
  end: number;
}

export interface MatchInfo {
  n: number;
  index: number;
  end: number;
  match: string;
  groups: GroupInfo[];
}

export interface ExplainerLine {
  token: string;
  meaning: string;
}

export interface QuickRefItem {
  token: string;
  desc: string;
  cat: string;
}

type WorkTab = 'match' | 'substitution';

const QUICK_REF: QuickRefItem[] = [
  { cat: 'Character classes', token: '[abc]', desc: 'A single character of: a, b, or c' },
  { cat: 'Character classes', token: '[^abc]', desc: 'A character except: a, b, or c' },
  { cat: 'Character classes', token: '[a-z]', desc: 'A character in the range a-z' },
  { cat: 'Character classes', token: '.', desc: 'Any character except line break (unless s)' },
  { cat: 'Meta sequences', token: '\\w', desc: 'Word character [A-Za-z0-9_]' },
  { cat: 'Meta sequences', token: '\\W', desc: 'Non-word character' },
  { cat: 'Meta sequences', token: '\\d', desc: 'Digit [0-9]' },
  { cat: 'Meta sequences', token: '\\D', desc: 'Non-digit' },
  { cat: 'Meta sequences', token: '\\s', desc: 'Whitespace' },
  { cat: 'Meta sequences', token: '\\S', desc: 'Non-whitespace' },
  { cat: 'Anchors', token: '^', desc: 'Start of string (or line with m)' },
  { cat: 'Anchors', token: '$', desc: 'End of string (or line with m)' },
  { cat: 'Anchors', token: '\\b', desc: 'Word boundary' },
  { cat: 'Anchors', token: '\\B', desc: 'Non-word boundary' },
  { cat: 'Quantifiers', token: 'a?', desc: 'Zero or one of a' },
  { cat: 'Quantifiers', token: 'a*', desc: 'Zero or more of a' },
  { cat: 'Quantifiers', token: 'a+', desc: 'One or more of a' },
  { cat: 'Quantifiers', token: 'a{3}', desc: 'Exactly 3 of a' },
  { cat: 'Quantifiers', token: 'a{3,}', desc: '3 or more of a' },
  { cat: 'Quantifiers', token: 'a{3,6}', desc: 'Between 3 and 6 of a' },
  { cat: 'Groups', token: '(...)', desc: 'Capturing group' },
  { cat: 'Groups', token: '(?:...)', desc: 'Non-capturing group' },
  { cat: 'Groups', token: '(?<name>...)', desc: 'Named capturing group' },
  { cat: 'Groups', token: 'a|b', desc: 'Alternate — match a or b' },
  { cat: 'Lookaround', token: '(?=...)', desc: 'Positive lookahead' },
  { cat: 'Lookaround', token: '(?!...)', desc: 'Negative lookahead' },
  { cat: 'Lookaround', token: '(?<=...)', desc: 'Positive lookbehind' },
  { cat: 'Lookaround', token: '(?<!...)', desc: 'Negative lookbehind' },
  { cat: 'Flags', token: 'g', desc: 'Global — find all matches' },
  { cat: 'Flags', token: 'i', desc: 'Case-insensitive' },
  { cat: 'Flags', token: 'm', desc: 'Multiline — ^ $ match line ends' },
  { cat: 'Flags', token: 's', desc: 'Dotall — . matches newlines' },
  { cat: 'Flags', token: 'u', desc: 'Unicode' },
  { cat: 'Flags', token: 'y', desc: 'Sticky — match from lastIndex' },
  { cat: 'Substitution', token: '$&', desc: 'Entire match' },
  { cat: 'Substitution', token: '$1', desc: 'Capture group 1' },
  { cat: 'Substitution', token: '$$', desc: 'Literal $' },
];

const MATCH_COLORS = [
  'var(--regex-m1, #64ffda)',
  'var(--regex-m2, #a78bfa)',
  'var(--regex-m3, #fbbf24)',
  'var(--regex-m4, #fb7185)',
  'var(--regex-m5, #38bdf8)',
];

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  templateUrl: './regex-tester.component.html',
  styleUrl: './regex-tester.component.scss',
})
export class RegexTesterComponent implements OnInit {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly quickRef = QUICK_REF;
  readonly refCats = [...new Set(QUICK_REF.map((r) => r.cat))];

  tab: WorkTab = 'match';
  pattern = '';
  text = '';
  replaceWith = '';
  flagG = true;
  flagI = false;
  flagM = false;
  flagS = false;
  flagU = false;
  flagY = false;
  error = '';
  matches: MatchInfo[] = [];
  highlighted: SafeHtml = '';
  substitutionOut = '';
  explanation: ExplainerLine[] = [];
  delimiter = '/';
  refFilter = '';
  showRef = true;
  selectedMatch: number | null = null;

  ngOnInit(): void {
    this.sample(false);
  }

  get flags(): string {
    return (
      (this.flagG ? 'g' : '') +
      (this.flagI ? 'i' : '') +
      (this.flagM ? 'm' : '') +
      (this.flagS ? 's' : '') +
      (this.flagU ? 'u' : '') +
      (this.flagY ? 'y' : '')
    );
  }

  get flavorLabel(): string {
    return 'JavaScript (ECMAScript)';
  }

  get filteredRef(): QuickRefItem[] {
    const q = this.refFilter.trim().toLowerCase();
    if (!q) return this.quickRef;
    return this.quickRef.filter(
      (r) => r.token.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.cat.toLowerCase().includes(q)
    );
  }

  hasRefCat(cat: string): boolean {
    return this.filteredRef.some((r) => r.cat === cat);
  }

  refItemsFor(cat: string): QuickRefItem[] {
    return this.filteredRef.filter((r) => r.cat === cat);
  }

  matchColor(n: number): string {
    return MATCH_COLORS[(n - 1) % MATCH_COLORS.length];
  }

  get fullPattern(): string {
    return `${this.delimiter}${this.pattern}${this.delimiter}${this.flags}`;
  }

  run(): void {
    this.error = '';
    this.matches = [];
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(this.text));
    this.substitutionOut = '';
    this.explanation = this.buildExplanation(this.pattern);
    this.selectedMatch = null;

    if (!this.pattern) return;

    let re: RegExp;
    try {
      re = new RegExp(this.pattern, this.flags || undefined);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Invalid regular expression';
      return;
    }

    try {
      this.matches = this.collectMatches(re, this.text);
      this.highlighted = this.sanitizer.bypassSecurityTrustHtml(this.buildHighlightHtml(this.text, this.matches));
      if (this.tab === 'substitution') {
        this.substitutionOut = this.applySubstitution(re, this.text, this.replaceWith);
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Match failed';
    }
  }

  setTab(tab: WorkTab): void {
    this.tab = tab;
    this.run();
  }

  toggleFlag(flag: 'g' | 'i' | 'm' | 's' | 'u' | 'y'): void {
    const map = {
      g: 'flagG',
      i: 'flagI',
      m: 'flagM',
      s: 'flagS',
      u: 'flagU',
      y: 'flagY',
    } as const;
    const key = map[flag];
    (this as unknown as Record<string, boolean>)[key] = !(this as unknown as Record<string, boolean>)[key];
    this.run();
  }

  insertToken(token: string): void {
    this.pattern += token;
    this.run();
  }

  selectMatch(n: number): void {
    this.selectedMatch = this.selectedMatch === n ? null : n;
  }

  copyPattern(): void {
    void this.clip.copy(this.fullPattern);
  }

  copyMatches(): void {
    const body = this.matches
      .map((m) => {
        const groups = m.groups.map((g) => `  group ${g.num}${g.name ? ` (${g.name})` : ''}: ${g.value}`).join('\n');
        return `Match ${m.n}: ${JSON.stringify(m.match)} [${m.index}-${m.end}]\n${groups}`;
      })
      .join('\n\n');
    void this.clip.copy(body || '(no matches)');
  }

  sample(runNow = true): void {
    this.pattern = '(?<user>\\w+)@(?<domain>[\\w.-]+\\.\\w+)';
    this.text =
      'Contact support@example.com or hello@breejeshrathod.com for help.\nAlso invalid: not-an-email and a@b.';
    this.replaceWith = '[$<user> at $<domain>]';
    this.flagG = true;
    this.flagI = false;
    this.flagM = true;
    this.flagS = false;
    this.flagU = false;
    this.flagY = false;
    this.tab = 'match';
    if (runNow) this.run();
    else queueMicrotask(() => this.run());
  }

  clearAll(): void {
    this.pattern = '';
    this.text = '';
    this.replaceWith = '';
    this.matches = [];
    this.error = '';
    this.substitutionOut = '';
    this.explanation = [];
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml('');
  }

  private collectMatches(re: RegExp, text: string): MatchInfo[] {
    const out: MatchInfo[] = [];
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const globalRe = new RegExp(re.source, flags);
    let m: RegExpExecArray | null;
    let n = 0;
    let guard = 0;
    while ((m = globalRe.exec(text)) !== null) {
      n++;
      const groups: GroupInfo[] = [];
      const indices = (m as RegExpExecArray & { indices?: [number, number][] }).indices;
      for (let i = 1; i < m.length; i++) {
        if (m[i] === undefined) continue;
        let start = -1;
        let end = -1;
        if (indices?.[i]) {
          start = indices[i][0];
          end = indices[i][1];
        } else {
          // Approximate: search within match
          const rel = m[0].indexOf(m[i]!);
          start = rel >= 0 ? m.index + rel : m.index;
          end = start + m[i]!.length;
        }
        groups.push({
          num: i,
          value: m[i]!,
          start,
          end,
        });
      }
      // Named groups
      const named = m.groups || {};
      for (const [name, value] of Object.entries(named)) {
        if (value === undefined) continue;
        const existing = groups.find((g) => g.value === value && !g.name);
        if (existing) existing.name = name;
        else groups.push({ num: groups.length + 1, name, value, start: -1, end: -1 });
      }
      out.push({
        n,
        index: m.index,
        end: m.index + m[0].length,
        match: m[0],
        groups,
      });
      if (m[0] === '') globalRe.lastIndex++;
      if (++guard > 5000) break;
      if (!re.flags.includes('g') && !re.flags.includes('y')) break;
    }
    // If original had no g, only first match (unless y sticky finds more oddly)
    if (!re.flags.includes('g')) return out.slice(0, 1);
    return out;
  }

  private buildHighlightHtml(text: string, matches: MatchInfo[]): string {
    if (!text) return '';
    if (!matches.length) return this.escapeHtml(text);

    const parts: string[] = [];
    let cursor = 0;
    // Sort by index; skip overlaps
    const sorted = [...matches].sort((a, b) => a.index - b.index);
    for (const m of sorted) {
      if (m.index < cursor) continue;
      parts.push(this.escapeHtml(text.slice(cursor, m.index)));
      const color = MATCH_COLORS[(m.n - 1) % MATCH_COLORS.length];
      const body = this.escapeHtml(m.match);
      parts.push(
        `<mark class="rx-match" data-n="${m.n}" style="--m-color:${color}" title="Match ${m.n} · ${m.index}-${m.end}">${body}</mark>`
      );
      cursor = m.end;
    }
    parts.push(this.escapeHtml(text.slice(cursor)));
    // Preserve newlines
    return parts.join('').replace(/\n/g, '<br/>');
  }

  private applySubstitution(re: RegExp, text: string, replacement: string): string {
    try {
      // Ensure global for replace-all semantics when g is set
      return text.replace(re, replacement);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Substitution failed';
      return '';
    }
  }

  private buildExplanation(pattern: string): ExplainerLine[] {
    if (!pattern) return [];
    const lines: ExplainerLine[] = [];
    // Lightweight walk — not a full parser; good enough for learning like regex101's sidebar
    let i = 0;
    while (i < pattern.length) {
      const c = pattern[i];
      if (c === '\\' && i + 1 < pattern.length) {
        const n = pattern[i + 1];
        const pair = '\\' + n;
        const map: Record<string, string> = {
          '\\d': 'Matches any digit character [0-9]',
          '\\D': 'Matches any non-digit character',
          '\\w': 'Matches any word character [A-Za-z0-9_]',
          '\\W': 'Matches any non-word character',
          '\\s': 'Matches any whitespace character',
          '\\S': 'Matches any non-whitespace character',
          '\\b': 'Word boundary',
          '\\B': 'Non-word boundary',
          '\\n': 'Newline',
          '\\t': 'Tab',
          '\\.': 'Literal .',
          '\\*': 'Literal *',
          '\\+': 'Literal +',
          '\\?': 'Literal ?',
          '\\(': 'Literal (',
          '\\)': 'Literal )',
          '\\[': 'Literal [',
          '\\]': 'Literal ]',
        };
        lines.push({ token: pair, meaning: map[pair] || `Escaped literal ${n}` });
        i += 2;
        continue;
      }
      if (c === '[') {
        const end = pattern.indexOf(']', i + 1);
        if (end > i) {
          const token = pattern.slice(i, end + 1);
          const neg = token[1] === '^';
          lines.push({
            token,
            meaning: neg ? 'Negated character class — match one character not listed' : 'Character class — match one listed character',
          });
          i = end + 1;
          continue;
        }
      }
      if (c === '(') {
        if (pattern.startsWith('(?:', i)) {
          lines.push({ token: '(?:', meaning: 'Non-capturing group start' });
          i += 3;
          continue;
        }
        if (pattern.startsWith('(?<', i)) {
          const close = pattern.indexOf('>', i + 3);
          if (close > i) {
            const name = pattern.slice(i + 3, close);
            lines.push({ token: `(?<${name}>`, meaning: `Named capturing group "${name}"` });
            i = close + 1;
            continue;
          }
        }
        if (pattern.startsWith('(?=', i)) {
          lines.push({ token: '(?=', meaning: 'Positive lookahead' });
          i += 3;
          continue;
        }
        if (pattern.startsWith('(?!', i)) {
          lines.push({ token: '(?!', meaning: 'Negative lookahead' });
          i += 3;
          continue;
        }
        if (pattern.startsWith('(?<=', i)) {
          lines.push({ token: '(?<=', meaning: 'Positive lookbehind' });
          i += 4;
          continue;
        }
        if (pattern.startsWith('(?<!', i)) {
          lines.push({ token: '(?<!', meaning: 'Negative lookbehind' });
          i += 4;
          continue;
        }
        lines.push({ token: '(', meaning: 'Capturing group start' });
        i++;
        continue;
      }
      if (c === ')') {
        lines.push({ token: ')', meaning: 'Group end' });
        i++;
        continue;
      }
      if (c === '^') {
        lines.push({ token: '^', meaning: 'Start of string (or line if multiline)' });
        i++;
        continue;
      }
      if (c === '$') {
        lines.push({ token: '$', meaning: 'End of string (or line if multiline)' });
        i++;
        continue;
      }
      if (c === '.') {
        lines.push({ token: '.', meaning: 'Any character (except newline unless s flag)' });
        i++;
        continue;
      }
      if (c === '|') {
        lines.push({ token: '|', meaning: 'Alternation — match either side' });
        i++;
        continue;
      }
      if (c === '*' || c === '+' || c === '?') {
        const mean =
          c === '*' ? 'Quantifier: 0 or more of previous' : c === '+' ? 'Quantifier: 1 or more of previous' : 'Quantifier: 0 or 1 of previous';
        lines.push({ token: c, meaning: mean });
        i++;
        continue;
      }
      if (c === '{') {
        const end = pattern.indexOf('}', i + 1);
        if (end > i) {
          const token = pattern.slice(i, end + 1);
          lines.push({ token, meaning: `Quantifier: previous atom ${token}` });
          i = end + 1;
          continue;
        }
      }
      // Literal run
      let j = i + 1;
      while (j < pattern.length && !'\\[]()^$.|*+?{}'.includes(pattern[j])) j++;
      const lit = pattern.slice(i, j);
      lines.push({ token: lit, meaning: lit.length === 1 ? `Literal character "${lit}"` : `Literal text "${lit}"` });
      i = j;
    }
    return lines;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
