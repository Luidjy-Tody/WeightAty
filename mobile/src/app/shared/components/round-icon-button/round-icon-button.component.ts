import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/**
 * Bouton rond d'action (retour, options…) : bordure fine, icône centrée,
 * zone tactile de 44 px et libellé accessible obligatoire.
 */
@Component({
  selector: 'app-round-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <button type="button" class="round-button" [attr.aria-label]="label()" (click)="clicked.emit()">
      <ion-icon [name]="icon()" aria-hidden="true"></ion-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .round-button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        margin-inline: 6px;
        padding: 0;
        border: 1px solid var(--wat-border);
        border-radius: 50%;
        background: var(--wat-surface);
        color: var(--wat-green-900);
        font-size: 20px;
        cursor: pointer;
      }

      .round-button:active {
        background: var(--wat-emerald-50);
      }
    `,
  ],
})
export class RoundIconButtonComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();

  readonly clicked = output<void>();
}
