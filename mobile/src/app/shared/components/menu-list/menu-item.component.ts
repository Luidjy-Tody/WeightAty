import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';

/**
 * Ligne de menu : icône dans une pastille vert très clair, titre en gras,
 * sous-titre gris et chevron. À utiliser dans un `app-menu-list`.
 */
@Component({
  selector: 'app-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonIcon],
  template: `
    <a class="menu-item" [routerLink]="link()">
      <span class="menu-item__icon">
        <ion-icon [name]="icon()" aria-hidden="true"></ion-icon>
      </span>

      <span class="menu-item__text">
        <span class="menu-item__title">{{ title() }}</span>
        @if (subtitle()) {
          <span class="menu-item__subtitle">{{ subtitle() }}</span>
        }
      </span>

      <ion-icon class="menu-item__chevron" name="chevron-forward" aria-hidden="true"></ion-icon>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 64px;
        padding: 12px 14px;
        background: var(--wat-surface);
        text-decoration: none;
        color: inherit;
      }

      :host + :host .menu-item {
        border-top: 1px solid var(--wat-border);
      }

      .menu-item__icon {
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: var(--wat-emerald-100);
        color: var(--wat-green-800);
      }

      .menu-item__icon ion-icon {
        font-size: 21px;
      }

      .menu-item__text {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .menu-item__title {
        color: var(--wat-ink);
        font-size: 15px;
        font-weight: 600;
      }

      .menu-item__subtitle {
        color: var(--wat-muted);
        font-size: 13px;
      }

      .menu-item__chevron {
        flex: 0 0 auto;
        color: var(--wat-muted);
        font-size: 18px;
      }

      .menu-item:active {
        background: var(--wat-emerald-50);
      }
    `,
  ],
})
export class MenuItemComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly link = input.required<string>();
}
