import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';
import { RouteLineComponent } from '../../../../shared/components/route-line/route-line.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { CURRENCY_SYMBOL, type Trajet } from '../../../../shared/models/trajet.model';
import { formatDateFr } from '../../../../shared/utils/trajet-format';
import { trajetBadge } from '../../../../shared/utils/status';

/** Carte d'un trajet dans la liste « Trajets publiés ». */
@Component({
  selector: 'app-trajet-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonButton, RouteLineComponent, StatusBadgeComponent],
  templateUrl: './trajet-card.component.html',
  styleUrls: ['./trajet-card.component.scss'],
})
export class TrajetCardComponent {
  readonly trajet = input.required<Trajet>();

  readonly badge = computed(() => trajetBadge(this.trajet().statut));

  readonly dateLabel = computed(() => {
    const trajet = this.trajet();
    const depart = formatDateFr(trajet.dateDepart);
    const arrivee = formatDateFr(trajet.dateArrivee);

    return !arrivee || arrivee === depart ? depart : `Du ${depart} au ${arrivee}`;
  });

  readonly weightLabel = computed(() => `${this.trajet().poidsDisponibleKg} kg`);

  readonly priceLabel = computed(() => {
    const prix = this.trajet().prixParKg;
    return prix === null ? null : `${CURRENCY_SYMBOL} ${prix} / kg`;
  });

  /** Référence affichée : compagnie et numéro de vol. */
  readonly flightLabel = computed(() =>
    [this.trajet().compagnieAerienne, this.trajet().numeroVol]
      .filter((part): part is string => Boolean(part))
      .join(' · ')
  );
}
