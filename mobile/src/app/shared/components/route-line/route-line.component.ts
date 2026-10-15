import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { splitCityCode } from '../../utils/location';

/**
 * Ligne d'itinéraire « Origine — avion — Destination ».
 * Variante `stacked` : ville en gros et code aéroport en petit dessous.
 */
@Component({
  selector: 'app-route-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    @if (variant() === 'stacked') {
      <div class="route route--stacked">
        <div class="route__place">
          <span class="route__city">{{ origineParts().city }}</span>
          @if (origineParts().code) {
            <span class="route__code">{{ origineParts().code }}</span>
          }
        </div>

        <ion-icon class="route__icon" name="airplane-outline" aria-hidden="true"></ion-icon>

        <div class="route__place route__place--end">
          <span class="route__city">{{ destinationParts().city }}</span>
          @if (destinationParts().code) {
            <span class="route__code">{{ destinationParts().code }}</span>
          }
        </div>
      </div>
    } @else {
      <p class="route route--inline">
        <span class="route__city">{{ origine() }}</span>
        <ion-icon class="route__icon" name="airplane-outline" aria-hidden="true"></ion-icon>
        <span class="route__city">{{ destination() }}</span>
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .route--stacked {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 10px;
      }

      .route__place {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .route__place--end {
        align-items: flex-end;
        text-align: right;
      }

      .route__city {
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .route__code {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.06em;
        opacity: 0.7;
      }

      .route--inline {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        min-width: 0;
      }

      .route--inline .route__city {
        font-size: 15px;
      }

      .route__icon {
        flex: 0 0 auto;
      }
    `,
  ],
})
export class RouteLineComponent {
  readonly origine = input.required<string>();
  readonly destination = input.required<string>();
  readonly variant = input<'inline' | 'stacked'>('inline');

  readonly origineParts = computed(() => splitCityCode(this.origine()));
  readonly destinationParts = computed(() => splitCityCode(this.destination()));
}
