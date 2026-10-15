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
import { ColisService } from '../../core/services/colis.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import type { ColisListItem } from '../../shared/models/colis.model';
import { ParcelCardComponent } from '../../shared/components/parcel-card/parcel-card.component';

/** Nombre de colis chargés par page. */
const PAGE_SIZE = 20;

/** Écran « Mes colis » : liste des colis de l'expéditeur connecté. */
@Component({
  selector: 'app-colis',
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
    ParcelCardComponent,
  ],
  templateUrl: './colis.page.html',
  styleUrls: ['./colis.page.scss'],
})
export class ColisPage {
  private readonly colisService = inject(ColisService);

  readonly colis = signal<ColisListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos colis. Vérifiez votre connexion.');

  readonly hasMore = computed(() => this.colis().length < this.total());

  ionViewWillEnter(): void {
    this.load();
  }

  /** Charge la première page de colis. */
  private load(done?: () => void): void {
    this.error.set(false);

    this.colisService.getMyColis(PAGE_SIZE, 0).subscribe({
      next: (page) => {
        this.colis.set(page.items);
        this.total.set(page.total);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos colis. Vérifiez votre connexion.'
        );
        this.error.set(true);
        done?.();
      },
    });
  }

  /** Charge la page suivante. */
  loadMore(): void {
    if (this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.colisService.getMyColis(PAGE_SIZE, this.colis().length).subscribe({
      next: (page) => {
        this.colis.update((current) => [...current, ...page.items]);
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

  refresh(event: Event): void {
    const refresher = event.target as unknown as { complete: () => Promise<void> };
    this.load(() => void refresher.complete());
  }
}
