import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly theme = inject(ThemeService);
  readonly privacyTagline = environment.privacyTagline;

  search = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() menuToggle = new EventEmitter<void>();

  onSearch(value: string): void {
    this.search = value;
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.search = '';
    this.searchChange.emit('');
  }
}
