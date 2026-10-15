import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TrajetService } from '../../core/services/trajet.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import type { Review } from '../../shared/models/user.model';
import { ReviewCardComponent } from '../profil/components/review-card/review-card.component';

/** Nombre d'avis chargés par page. */
const PAGE_SIZE = 20;

/** Écran listant les avis publics d'un membre. */
@Component({
  selector: 'app-avis-membre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    ReviewCardComponent,
  ],
  templateUrl: './avis-membre.page.html',
  styleUrls: ['./avis-membre.page.scss'],
})
export class AvisMembrePage {
  private readonly trajetService = inject(TrajetService);

  /** Identifiant du membre (paramètre de route). */
  readonly userId = input.required<string>();

  readonly avis = signal<Review[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger les avis.');

  readonly hasMore = computed(() => this.avis().length < this.total());

  ionViewWillEnter(): void {
    this.load();
  }

  loadMore(): void {
    if (this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.trajetService.getUserReviews(this.userId(), PAGE_SIZE, this.avis().length).subscribe({
      next: (page) => {
        this.avis.update((current) => [...current, ...page.items]);
        this.total.set(page.total);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  retry(): void {
    this.loading.set(true);
    this.load();
  }

  private load(): void {
    this.error.set(false);

    this.trajetService.getUserReviews(this.userId(), PAGE_SIZE, 0).subscribe({
      next: (page) => {
        this.avis.set(page.items);
        this.total.set(page.total);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error) ? API_UNREACHABLE_MESSAGE : 'Impossible de charger les avis.'
        );
        this.error.set(true);
      },
    });
  }
}
