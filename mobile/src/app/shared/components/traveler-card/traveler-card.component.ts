import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { AvatarComponent } from '../avatar/avatar.component';
import type { PublicUserSummary } from '../../models/trajet.model';

/** Carte « Votre voyageur » avec accès direct à la conversation. */
@Component({
  selector: 'app-traveler-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, AvatarComponent],
  template: `
    <div class="card">
      <app-avatar
        [firstName]="nameParts().firstName"
        [lastName]="nameParts().lastName"
        [photoUrl]="traveler().photoUrl"
        size="md"
      />

      <div class="card__info">
        <p class="card__label">Votre voyageur</p>
        <p class="card__name">{{ traveler().displayName }}</p>

        @if (traveler().nombreAvis > 0) {
          <p class="card__rating">
            <ion-icon name="star" aria-hidden="true"></ion-icon>
            <span>{{ traveler().noteMoyenne.toFixed(1) }}</span>
          </p>
        }
      </div>

      <button
        type="button"
        class="card__chat"
        aria-label="Contacter le voyageur"
        (click)="contact.emit()"
      >
        <ion-icon name="chatbubble-ellipses-outline" aria-hidden="true"></ion-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--wat-surface);
        border: 1px solid var(--wat-border);
        border-radius: var(--wat-radius-lg);
        box-shadow: var(--wat-shadow-card);
      }

      .card__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1 1 auto;
      }

      .card__label {
        margin: 0;
        color: var(--wat-muted);
        font-size: 12px;
      }

      .card__name {
        margin: 0;
        color: var(--wat-ink);
        font-size: 16px;
        font-weight: 700;
      }

      .card__rating {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 0;
        color: var(--wat-muted);
        font-size: 13px;
        font-weight: 600;
      }

      .card__rating ion-icon {
        color: #f59e0b;
        font-size: 15px;
      }

      .card__chat {
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid var(--wat-border);
        border-radius: 50%;
        background: var(--wat-surface);
        color: var(--wat-green-800);
        font-size: 20px;
        cursor: pointer;
      }

      .card__chat:active {
        background: var(--wat-emerald-50);
      }
    `,
  ],
})
export class TravelerCardComponent {
  readonly traveler = input.required<PublicUserSummary>();
  readonly contact = output<void>();

  readonly nameParts = computed(() => {
    const parts = this.traveler().displayName.trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  });
}
