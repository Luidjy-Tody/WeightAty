import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RatingStarsComponent } from '../../../../shared/components/rating-stars/rating-stars.component';
import { TempsRelatifPipe } from '../../../../shared/pipes/relative-time.pipe';
import type { Review } from '../../../../shared/models/user.model';

/** Carte d'une évaluation reçue. */
@Component({
  selector: 'app-review-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RatingStarsComponent, TempsRelatifPipe],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.scss'],
})
export class ReviewCardComponent {
  readonly review = input.required<Review>();

  /** Nom de l'auteur tel que fourni par l'API (respecte sa confidentialité). */
  readonly authorLabel = computed(() => this.review().auteur.displayName);
}
