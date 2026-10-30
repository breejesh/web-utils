import { Component, EventEmitter, Input, Output, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TOOLS } from '../../core/data/tools.registry';
import { CommandPaletteService } from '../../core/services/command-palette.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../shared/icons';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent, RouterLink, BrandMarkComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly theme = inject(ThemeService);
  readonly palette = inject(CommandPaletteService);

  @Input() menuOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  readonly repoUrl = environment.repoUrl;
  readonly siteName = environment.siteName;
  readonly toolCount = TOOLS.length;
  readonly modKey = signal('Ctrl');

  constructor() {
    afterNextRender(() => {
      if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) this.modKey.set('⌘');
    });
  }

  readonly themeIcon = computed<IconName>(() => {
    const pref = this.theme.preference();
    return pref === 'system' ? 'monitor' : pref === 'light' ? 'sun' : 'moon';
  });

  readonly themeLabel = computed(() => {
    const pref = this.theme.preference();
    const next = pref === 'dark' ? 'light' : pref === 'light' ? 'system' : 'dark';
    return `Theme: ${pref}. Switch to ${next}`;
  });
}
