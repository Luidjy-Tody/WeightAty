import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { TrajetService } from '../../core/services/trajet.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import type { Trajet } from '../../shared/models/trajet.model';
import { countLabel } from '../../shared/utils/plural';
import { TrajetCardComponent } from './components/trajet-card/trajet-card.component';

/** Page « Trajets publiés » : liste des trajets du voyageur connecté. */
@Component({
  selector: 'app-trajets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    TrajetCardComponent,
  ],
  templateUrl: './trajets.page.html',
  styleUrls: ['./trajets.page.scss'],
})
export class TrajetsPage {
  private readonly trajetService = inject(TrajetService);

  readonly trajets = signal<Trajet[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos trajets. Vérifiez votre connexion.');

  /** Compteur affiché en tête de liste. */
  readonly countLabel = computed(() =>
    countLabel(this.trajets().length, 'trajet publié', 'trajets publiés')
  );

  ionViewWillEnter(): void {
    this.load();
  }

  /** Charge la liste depuis l'API. */
  private load(done?: () => void): void {
    this.error.set(false);

    this.trajetService.getMyTrajets().subscribe({
      next: (page) => {
        this.trajets.set(page.items);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos trajets. Vérifiez votre connexion.'
        );
        this.error.set(true);
        done?.();
      },
    });
  }

  /** Réessaie après une erreur. */
  retry(): void {
    this.loading.set(true);
    this.load();
  }

  /** Pull-to-refresh. */
  refresh(event: Event): void {
    const refresher = event.target as unknown as { complete: () => Promise<void> };
    this.load(() => void refresher.complete());
  }
}
