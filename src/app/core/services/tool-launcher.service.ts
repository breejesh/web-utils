import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getToolBySlug } from '../data/tools.registry';
import { UserStorageService } from './user-storage.service';

/** Opens a tool, optionally pre-filling its primary input (smart paste, palette, share links). */
@Injectable({ providedIn: 'root' })
export class ToolLauncherService {
  private readonly router = inject(Router);
  private readonly storage = inject(UserStorageService);

  async launch(slug: string, value?: string): Promise<void> {
    const tool = getToolBySlug(slug);
    if (!tool) return;
    await this.router.navigate(['/tools', slug]);
    if (value && tool.primaryField) {
      this.storage.requestRestore(slug, value, tool.primaryField);
    }
  }
}
