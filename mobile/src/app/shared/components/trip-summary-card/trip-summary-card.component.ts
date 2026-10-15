import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { RouteLineComponent } from '../route-line/route-line.component';
import type { Trajet } from '../../models/trajet.model';
import { formatDateFull } from '../../utils/datetime';
import { formatMoney, formatWeight } from '../../utils/money';

/**
 * Carte sombre récapitulant un trajet : itinéraire, date, poids disponible et
 * prix indicatif (au kg — le modèle ne stocke pas de prix « par colis »).
 */
@Component({
  selector: 'app-trip-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, RouteLineComponent],
  template: `
    <section class="trip">
      <p class="trip__eyebrow">Trajet proposé</p>

      <app-route-line
        [origine]="trajet().villeDepart"
        [destination]="trajet().villeArrivee"
        variant="stacked"
      />

      <div class="trip__tiles">
        <div class="tile">
          <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
          <span class="tile__label">Date</span>
          <span class="tile__value">{{ dateLabel() }}</span>
        </div>

        <div class="tile">
          <ion-icon name="scale-outline" aria-hidden="true"></ion-icon>
          <span class="tile__label">Poids disponible</span>
          <span class="tile__value">{{ weightLabel() }}</span>
        </div>
      </div>

      @if (trajet().prixParKg !== null) {
        <div class="trip__footer">
          <span class="trip__price-label">Prix indicatif</span>
          <span class="trip__price">
            {{ priceLabel() }}
            <small>/ kg</small>
          </span>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .trip {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        border-radius: var(--wat-radius-lg);
        background: linear-gradient(150deg, var(--wat-green-900), var(--wat-green-950));
        color: #ffffff;
        box-shadow: 0 12px 28px rgba(11, 61, 44, 0.2);
      }

      .trip__eyebrow {
        margin: 0;
        color: var(--wat-emerald-400);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .trip__tiles {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .tile {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px;
        border-radius: var(--wat-radius-md);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.14);
      }

      .tile ion-icon {
        color: var(--wat-emerald-400);
        font-size: 18px;
      }

      .tile__label {
        color: var(--wat-emerald-100);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .tile__value {
        font-size: 14px;
        font-weight: 700;
      }

      .trip__footer {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.14);
      }

      .trip__price-label {
        color: var(--wat-emerald-100);
        font-size: 13px;
      }

      .trip__price {
        color: var(--wat-emerald-400);
        font-size: 22px;
        font-weight: 800;
      }

      .trip__price small {
        font-size: 12px;
        font-weight: 600;
        opacity: 0.8;
      }
    `,
  ],
})
export class TripSummaryCardComponent {
  readonly trajet = input.required<Trajet>();

  readonly dateLabel = computed(() => formatDateFull(this.trajet().dateDepart));
  readonly weightLabel = computed(() => formatWeight(this.trajet().poidsDisponibleKg));
  readonly priceLabel = computed(() => formatMoney(this.trajet().prixParKg, this.trajet().devise));
}
