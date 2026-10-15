import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { PaiementService } from '../../core/services/paiement.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import type { Paiement } from '../../shared/models/paiement.model';
import { formatStamp } from '../../shared/utils/datetime';
import { formatMoney } from '../../shared/utils/money';

/** Écran « Mes paiements » : historique des rémunérations et paiements. */
@Component({
  selector: 'app-paiement',
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
  ],
  templateUrl: './paiement.page.html',
  styleUrls: ['./paiement.page.scss'],
})
export class PaiementPage {
  private readonly paiementService = inject(PaiementService);

  readonly paiements = signal<Paiement[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos paiements.');

  ionViewWillEnter(): void {
    this.load();
  }

  amount(paiement: Paiement): string {
    return formatMoney(paiement.montant, paiement.devise);
  }

  date(paiement: Paiement): string {
    return formatStamp(paiement.createdAt);
  }

  private load(done?: () => void): void {
    this.error.set(false);

    this.paiementService.getMyPaiements(50, 0).subscribe({
      next: (page) => {
        this.paiements.set(page.items);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error) ? API_UNREACHABLE_MESSAGE : 'Impossible de charger vos paiements.'
        );
        this.error.set(true);
        done?.();
      },
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
