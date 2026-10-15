import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
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
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../../shared/models/api-error.model';
import type { Review } from '../../../shared/models/user.model';
import { RatingSummaryCardComponent } from '../../../shared/components/rating-summary-card/rating-summary-card.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { ReviewCardComponent } from '../components/review-card/review-card.component';
import { Router } from '@angular/router';

/** Nombre d'avis chargés par page. */
const PAGE_SIZE = 20;

/**
 * Écran « Mes évaluations » : réputation (moyenne, étoiles, total) et liste
 * des avis reçus.
 *
 * La moyenne provient du profil (`GET /api/users/me`, `stats.noteMoyenne`) :
 * l'endpoint des avis ne la renvoie pas et la calculer sur la seule page
 * chargée ne serait pas fiable.
 */
@Component({
  selector: 'app-avis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonIcon,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    RatingSummaryCardComponent,
    RoundIconButtonComponent,
    ReviewCardComponent,
  ],
  templateUrl: './avis.page.html',
  styleUrls: ['./avis.page.scss'],
})
export class AvisPage {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly items = signal<Review[]>([]);
  readonly total = signal(0);
  readonly moyenne = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos évaluations.');

  readonly hasMore = computed(() => this.items().length < this.total());

  ionViewWillEnter(): void {
    this.load();
  }

  /** Retour à la page « Mon profil ». */
  async goBack(): Promise<void> {
    await this.router.navigate(['/profil']);
  }

  /** Charge la réputation et la première page d'avis. */
  private load(done?: () => void): void {
    this.error.set(false);

    forkJoin({
      profile: this.userService.getMyProfile(),
      page: this.userService.getMyReviews(PAGE_SIZE, 0),
    }).subscribe({
      next: ({ profile, page }) => {
        this.moyenne.set(profile.stats.noteMoyenne);
        this.total.set(page.total);
        this.items.set(page.items);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos évaluations.'
        );
        this.error.set(true);
        done?.();
      },
    });
  }

  /** Charge la page suivante d'avis. */
  loadMore(): void {
    if (this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.userService.getMyReviews(PAGE_SIZE, this.items().length).subscribe({
      next: (page) => {
        this.items.update((current) => [...current, ...page.items]);
        this.total.set(page.total);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
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
