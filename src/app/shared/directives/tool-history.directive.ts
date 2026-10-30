import { Directive, ElementRef, Input, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserStorageService } from '../../core/services/user-storage.service';

/**
 * Auto-saves control values to local history (when enabled for the tool), tracks the live value for
 * share links, and applies restore requests (history, smart paste, shared links).
 *
 * ```html
 * <textarea [(ngModel)]="input" [appToolHistory]="tool.slug"></textarea>
 * <textarea [(ngModel)]="a" [appToolHistory]="tool.slug" historyField="a"></textarea>
 * ```
 */
@Directive({
  selector: '[appToolHistory]',
  standalone: true,
})
export class ToolHistoryDirective implements OnInit, OnDestroy {
  private readonly storage = inject(UserStorageService);
  private readonly control = inject(NgControl, { optional: true, self: true });
  private readonly el = inject(ElementRef<HTMLElement>);

  @Input('appToolHistory') slug = '';
  @Input() historyField = 'input';
  @Input() historyDebounce = 900;
  @Input() historyMinLength = 2;

  private subs: Subscription[] = [];
  private lastSaved = '';
  private readonly ready = signal(false);

  constructor() {
    effect(() => {
      const req = this.storage.restoreRequest();
      if (!this.ready() || !req) return;
      if (req.slug !== this.slug || req.field !== this.historyField) return;
      const ctrl = this.control?.control;
      if (!ctrl) return;
      this.storage.consumeRestore(req.nonce);
      this.lastSaved = req.value;
      // Macrotask: NgModel writes its initial value in a microtask on fresh mounts, which would clobber ours.
      setTimeout(() => {
        ctrl.setValue(req.value);
        ctrl.markAsDirty();
        // Ensure template (ngModelChange) handlers re-run (encode/decode, hash, etc.)
        this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
        this.el.nativeElement.focus?.({ preventScroll: true });
      });
    });
  }

  ngOnInit(): void {
    const ctrl = this.control?.control;
    if (!ctrl || !this.slug) return;
    this.ready.set(true);

    const changes = ctrl.valueChanges;
    if (!changes) return;

    this.subs.push(changes.subscribe((v) => this.storage.setLiveValue(this.slug, this.historyField, String(v ?? ''))));

    this.subs.push(
      changes.pipe(debounceTime(this.historyDebounce), distinctUntilChanged()).subscribe((v) => {
        const value = String(v ?? '');
        if (value.trim().length < this.historyMinLength) return;
        if (value === this.lastSaved) return;
        this.lastSaved = value;
        this.storage.pushHistory(this.slug, value, this.historyField);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
