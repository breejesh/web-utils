import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  readonly isOpen = signal(false);
  /** Optional query to pre-fill when opening (e.g. from the home search field). */
  readonly initialQuery = signal('');

  open(query = ''): void {
    this.initialQuery.set(query);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }
}
