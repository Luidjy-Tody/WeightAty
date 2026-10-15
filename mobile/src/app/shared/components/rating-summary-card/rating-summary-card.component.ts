import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

/**
 * Carte récapitulative de réputation : note moyenne (1 décimale), étoiles
 * (demi-étoiles possibles) et nombre d'évaluations reçues.
 * Si aucune évaluation, affiche « Aucune évaluation ».
 */
@Component({
  selector: 'app-rating-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RatingStarsComponent],
  template: `
    <section class="summary" aria-label="Résumé de vos évaluations">
      @if (total() > 0) {
        <p class="summary__score">{{ scoreLabel() }}</p>
        <app-rating-stars [value]="moyenne()" [allowHalf]="true" size="lg" />
        <p class="summary__count">{{ countLabel() }}</p>
      } @else {
        <p class="summary__empty">Aucune évaluation</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .summary {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 24px 20px;
        border-radius: var(--wat-radius-lg);
        background: linear-gradient(150deg, var(--wat-green-900), var(--wat-green-950));
        box-shadow: 0 12px 28px rgba(11, 61, 44, 0.2);
        text-align: center;
      }

      .summary__score {
        margin: 0;
        color: var(--wat-emerald-400);
        font-size: 52px;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.03em;
      }

      .summary__count {
        margin: 4px 0 0;
        color: var(--wat-emerald-100);
        font-size: 13px;
      }

      .summary__empty {
        margin: 0;
        color: var(--wat-emerald-100);
        font-size: 16px;
        font-weight: 600;
      }
    `,
  ],
})
export class RatingSummaryCardComponent {
  /** Note moyenne reçue (sur 5). */
  readonly moyenne = input.required<number>();
  /** Nombre total d'évaluations reçues. */
  readonly total = input.required<number>();

  readonly scoreLabel = computed(() => this.moyenne().toFixed(1));

  readonly countLabel = computed(() =>
    this.total() > 1 ? `Basé sur ${this.total()} évaluations` : 'Basé sur 1 évaluation'
  );
}
