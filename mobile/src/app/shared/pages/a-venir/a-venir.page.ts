import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

/**
 * Écran générique « à venir » utilisé pour les rubriques dont l'écran
 * n'est pas encore développé. Le titre et le sous-titre proviennent des
 * `data` de la route (avec `withComponentInputBinding`).
 */
@Component({
  selector: 'app-a-venir',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="retour()" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>{{ titre() }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="avenir-content">
      <div class="placeholder">
        <ion-icon class="placeholder__icon" name="cube-outline" aria-hidden="true"></ion-icon>
        <h1 class="placeholder__title">{{ titre() }}</h1>
        @if (sousTitre()) {
          <p class="placeholder__subtitle">{{ sousTitre() }}</p>
        }
        <p class="placeholder__note">Cet écran sera bientôt disponible.</p>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .avenir-content {
        --background: var(--wat-bg);
      }

      .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 96px 32px;
        text-align: center;
      }

      .placeholder__icon {
        font-size: 52px;
        color: var(--wat-emerald-500);
      }

      .placeholder__title {
        margin: 0;
        color: var(--wat-ink);
        font-size: 20px;
        font-weight: 700;
      }

      .placeholder__subtitle {
        margin: 0;
        color: #334155;
        font-size: 15px;
        line-height: 1.5;
      }

      .placeholder__note {
        margin: 6px 0 0;
        color: var(--wat-muted);
        font-size: 13px;
      }
    `,
  ],
})
export class AVenirPage {
  readonly titre = input<string>('Bientôt disponible');
  readonly sousTitre = input<string>('');
  /** Destination du bouton retour. */
  readonly retour = input<string>('/profil');
}
