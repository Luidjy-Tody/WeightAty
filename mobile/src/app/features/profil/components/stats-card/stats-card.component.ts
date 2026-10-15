import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ProfileStats } from '../../../../shared/models/user.model';

/** Carte de statistiques (Envois, Trajets, Fiabilité) chevauchant l'en-tête. */
@Component({
  selector: 'app-stats-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss'],
})
export class StatsCardComponent {
  readonly stats = input.required<ProfileStats>();
}
