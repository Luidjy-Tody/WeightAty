import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Carte de menu : fond blanc très arrondi, bordure fine, lignes séparées par
 * un trait fin (les `app-menu-item` projetés).
 */
@Component({
  selector: 'app-menu-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav class="menu-list"><ng-content /></nav>`,
  styles: [
    `
      :host {
        display: block;
      }

      .menu-list {
        display: block;
        background: var(--wat-surface);
        border: 1px solid var(--wat-border);
        border-radius: var(--wat-radius-lg);
        box-shadow: var(--wat-shadow-card);
        overflow: hidden;
      }
    `,
  ],
})
export class MenuListComponent {}
