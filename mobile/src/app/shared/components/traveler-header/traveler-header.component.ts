import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import type { PublicUserSummary } from '../../models/trajet.model';

/**
 * En-tête d'un membre : avatar (photo ou initiales), nom abrégé, note moyenne,
 * lien vers ses avis et badge « Identité vérifiée » si le compte est vérifié.
 */
@Component({
  selector: 'app-traveler-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, RouterLink, AvatarComponent],
  template: `
    <div class="traveler">
      <app-avatar
        [firstName]="nameParts().firstName"
        [lastName]="nameParts().lastName"
        [photoUrl]="traveler().photoUrl"
        size="md"
      />

      <div class="traveler__info">
        <p class="traveler__name">{{ traveler().displayName }}</p>

        @if (traveler().nombreAvis > 0) {
          <div class="traveler__rating">
            <ion-icon name="star" aria-hidden="true"></ion-icon>
            <span class="traveler__score">{{ traveler().noteMoyenne.toFixed(1) }}</span>
            <a class="traveler__reviews" [routerLink]="['/avis', traveler().id]">
              {{ traveler().nombreAvis }} avis
            </a>
          </div>
        } @else {
          <p class="traveler__rating traveler__rating--empty">Aucun avis pour le moment</p>
        }

        @if (traveler().isVerified) {
          <span class="traveler__badge">
            <ion-icon name="checkmark-circle" aria-hidden="true"></ion-icon>
            Identité vérifiée
          </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .traveler {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .traveler__info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .traveler__name {
        margin: 0;
        color: var(--wat-ink);
        font-size: 17px;
        font-weight: 700;
      }

      .traveler__rating {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font-size: 14px;
      }

      .traveler__rating ion-icon {
        color: #f59e0b;
        font-size: 16px;
      }

      .traveler__rating--empty {
        color: var(--wat-muted);
        font-size: 13px;
      }

      .traveler__score {
        font-weight: 700;
      }

      .traveler__reviews {
        color: var(--wat-green-700);
        font-size: 13px;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .traveler__badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        align-self: flex-start;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--wat-emerald-100);
        color: var(--wat-green-800);
        font-size: 11px;
        font-weight: 700;
      }

      .traveler__badge ion-icon {
        font-size: 14px;
      }
    `,
  ],
})
export class TravelerHeaderComponent {
  readonly traveler = input.required<PublicUserSummary>();

  /** Découpe du nom abrégé (« Jean D. ») pour les initiales de l'avatar. */
  readonly nameParts = computed(() => {
    const parts = this.traveler().displayName.trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  });
}
