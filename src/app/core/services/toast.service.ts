import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  success(text: string, ms = 2200): void {
    this.push(text, 'success', ms);
  }

  error(text: string, ms = 3200): void {
    this.push(text, 'error', ms);
  }

  info(text: string, ms = 2200): void {
    this.push(text, 'info', ms);
  }

  private push(text: string, type: ToastMessage['type'], ms: number): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, text, type }]);
    setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
    }, ms);
  }
}
