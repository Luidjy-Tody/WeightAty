import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getInitials } from '../../utils/user-format';
import { mediaUrl } from '../../utils/media-url';

/** Taille visuelle de l'avatar. */
export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Avatar carré arrondi : affiche la photo de l'utilisateur si elle existe,
 * sinon ses initiales (calculées à partir du nom complet).
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (photo(); as source) {
      <img [class]="'avatar avatar--' + size()" [src]="source" alt="" />
    } @else {
      <span [class]="'avatar avatar--' + size()">{{ initials() }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .avatar {
        display: grid;
        place-items: center;
        background: linear-gradient(140deg, var(--wat-emerald-400), var(--wat-green-800));
        border: 3px solid #ffffff;
        border-radius: 20px;
        color: #ffffff;
        font-weight: 700;
        letter-spacing: 0.02em;
        box-shadow: 0 6px 16px rgba(6, 40, 29, 0.35);
      }

      img.avatar {
        object-fit: cover;
      }

      .avatar--sm {
        width: 36px;
        height: 36px;
        border-width: 2px;
        border-radius: 12px;
        font-size: 13px;
      }

      .avatar--md {
        width: 56px;
        height: 56px;
        font-size: 20px;
      }

      .avatar--lg {
        width: 88px;
        height: 88px;
        border-radius: 26px;
        font-size: 30px;
      }
    `,
  ],
})
export class AvatarComponent {
  readonly firstName = input<string>('');
  readonly lastName = input<string>('');
  readonly size = input<AvatarSize>('md');
  /** Chemin de la photo de profil renvoyé par l'API. */
  readonly photoUrl = input<string | null>(null);

  readonly initials = computed(() => getInitials(this.firstName(), this.lastName()));
  readonly photo = computed(() => mediaUrl(this.photoUrl()));
}
