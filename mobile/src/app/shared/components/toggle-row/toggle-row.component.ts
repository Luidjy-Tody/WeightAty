import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonToggle } from '@ionic/angular';

/** Ligne de préférence : titre, description et interrupteur accessible. */
@Component({
  selector: 'app-toggle-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToggle],
  template: `
    <div class="toggle-row">
      <div class="toggle-row__text">
        <p class="toggle-row__title">{{ title() }}</p>
        @if (description()) {
          <p class="toggle-row__description">{{ description() }}</p>
        }
      </div>

      <ion-toggle
        class="toggle-row__switch"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        (ionChange)="changed.emit($event.detail.checked)"
      ></ion-toggle>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-height: 64px;
        padding: 12px 16px;
        background: var(--wat-surface);
      }

      :host + :host .toggle-row {
        border-top: 1px solid var(--wat-border);
      }

      .toggle-row__text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .toggle-row__title {
        margin: 0;
        color: var(--wat-ink);
        font-size: 15px;
        font-weight: 600;
      }

      .toggle-row__description {
        margin: 0;
        color: var(--wat-muted);
        font-size: 13px;
        line-height: 1.4;
      }

      .toggle-row__switch {
        flex: 0 0 auto;
        --handle-background-checked: #ffffff;
      }
    `,
  ],
})
export class ToggleRowComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly checked = input.required<boolean>();
  readonly disabled = input(false);
  /** Libellé accessible de l'interrupteur (ex. « Activer les notifications de messages »). */
  readonly ariaLabel = input.required<string>();

  readonly changed = output<boolean>();
}
