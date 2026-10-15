import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';
import { RouteLineComponent } from '../route-line/route-line.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import type { ColisListItem } from '../../models/colis.model';
import { colisBadge } from '../../utils/status';

/** Carte d'un colis dans la liste « Mes colis ». */
@Component({
  selector: 'app-parcel-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonButton, RouteLineComponent, StatusBadgeComponent],
  template: `
    <article class="parcel">
      <header class="parcel__header">
        <span class="parcel__ref">{{ colis().reference }}</span>
        <app-status-badge [label]="badge().label" [tone]="badge().tone" />
      </header>

      <app-route-line
        [origine]="colis().villeOrigine ?? 'Origine à définir'"
        [destination]="colis().villeDestination ?? 'Destination à définir'"
      />

      <ion-button
        class="parcel__action"
        expand="block"
        fill="outline"
        [routerLink]="['/colis', colis().id]"
      >
        {{ actionLabel() }}
      </ion-button>
    </article>
  `,
  styles: [
    `
      .parcel {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: var(--wat-surface);
        border: 1px solid var(--wat-border);
        border-radius: var(--wat-radius-lg);
        box-shadow: var(--wat-shadow-card);
      }

      .parcel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .parcel__ref {
        color: var(--wat-green-700);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .parcel__action {
        min-height: 44px;
        --border-radius: var(--wat-radius-md);
        --border-width: 1.5px;
        --border-color: var(--wat-emerald-500);
        --color: var(--wat-green-800);
        --background: #ffffff;
        font-size: 14px;
        font-weight: 700;
      }
    `,
  ],
})
export class ParcelCardComponent {
  readonly colis = input.required<ColisListItem>();

  readonly badge = computed(() => colisBadge(this.colis().statut));
  readonly actionLabel = computed(() =>
    this.colis().statut === 'livre' ? 'Voir la livraison' : 'Suivre le colis'
  );
}
