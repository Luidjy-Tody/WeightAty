import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** État visuel d'une étoile. */
export type StarState = 'full' | 'half' | 'empty';

/**
 * Étoiles de notation : affichage (lecture seule, demi-étoiles possibles) ou
 * saisie interactive (note entière de 1 à 5).
 */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <span
      class="stars"
      [class]="'stars stars--' + size()"
      [attr.aria-label]="ariaLabel()"
    >
      @for (star of stars(); track $index; let index = $index) {
        @if (interactive()) {
          <button
            type="button"
            class="star star--button"
            [attr.aria-label]="'Note : ' + (index + 1) + ' sur ' + max()"
            (click)="select(index + 1)"
          >
            <ion-icon [name]="iconFor(star)" aria-hidden="true"></ion-icon>
          </button>
        } @else {
          <ion-icon class="star" [name]="iconFor(star)" aria-hidden="true"></ion-icon>
        }
      }
    </span>
  `,
  styles: [
    `
      .stars {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        color: #f59e0b;
      }

      .stars--sm {
        font-size: 14px;
      }

      .stars--md {
        font-size: 16px;
      }

      .stars--lg {
        font-size: 26px;
        gap: 4px;
      }

      .star {
        color: #f59e0b;
      }

      .star--button {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: none;
        background: transparent;
        color: #f59e0b;
        font-size: 26px;
        cursor: pointer;
      }

      .star--button:active {
        transform: scale(0.94);
      }
    `,
  ],
})
export class RatingStarsComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(5);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly interactive = input(false);
  /** Autorise les demi-étoiles (affichage d'une moyenne). */
  readonly allowHalf = input(false);

  /** Note choisie (mode interactif). */
  readonly valueChange = output<number>();

  readonly stars = computed<StarState[]>(() => {
    const max = Math.max(1, Math.round(this.max()));
    const raw = Math.max(0, Math.min(this.value(), max));
    // Arrondi à la demi-étoile près pour l'affichage d'une moyenne.
    const value = this.allowHalf() ? Math.round(raw * 2) / 2 : Math.round(raw);

    return Array.from({ length: max }, (_, index) => {
      const remaining = value - index;

      if (remaining >= 1) {
        return 'full';
      }
      return this.allowHalf() && remaining >= 0.5 ? 'half' : 'empty';
    });
  });

  readonly ariaLabel = computed(() =>
    this.interactive()
      ? `Note actuelle : ${this.value()} sur ${this.max()}`
      : `Note : ${this.value()} sur ${this.max()}`
  );

  /** Nom d'icône IonIcons correspondant à l'état d'une étoile. */
  iconFor(state: StarState): string {
    switch (state) {
      case 'full':
        return 'star';
      case 'half':
        return 'star-half';
      default:
        return 'star-outline';
    }
  }

  select(note: number): void {
    this.valueChange.emit(note);
  }
}
