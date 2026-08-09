import { Directive, ElementRef, Input, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserStorageService } from '../../core/services/user-storage.service';

/**
 * Auto-saves control values to local history and applies restore requests.
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

  private sub?: Subscription;
  private lastSaved = '';
  private lastRestoreNonce = 0;

  constructor() {
    effect(() => {
      const req = this.storage.restoreRequest();
      if (!req || !this.slug) return;
      if (req.slug !== this.slug || req.field !== this.historyField) return;
      if (req.nonce === this.lastRestoreNonce) return;
      this.lastRestoreNonce = req.nonce;
      const ctrl = this.control?.control;
      if (!ctrl) return;
      ctrl.setValue(req.value);
      ctrl.markAsDirty();
      this.lastSaved = req.value;
      // Ensure template (ngModelChange) handlers re-run (encode/decode, hash, etc.)
      queueMicrotask(() => {
        this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  ngOnInit(): void {
    const ctrl = this.control?.control;
    if (!ctrl || !this.slug) return;

    this.sub = ctrl.valueChanges
      ?.pipe(debounceTime(this.historyDebounce), distinctUntilChanged())
      .subscribe((v) => {
        const value = String(v ?? '');
        if (value.trim().length < this.historyMinLength) return;
        if (value === this.lastSaved) return;
        this.lastSaved = value;
        this.storage.pushHistory(this.slug, value, this.historyField);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
