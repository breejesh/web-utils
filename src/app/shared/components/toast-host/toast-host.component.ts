import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-host" aria-live="polite" aria-relevant="additions">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.toast-success]="t.type === 'success'" [class.toast-error]="t.type === 'error'">
          {{ t.text }}
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toast = inject(ToastService);
}
