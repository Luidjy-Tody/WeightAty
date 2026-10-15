import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { ColisService } from '../../../core/services/colis.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../../shared/models/api-error.model';
import type { ColisDetail } from '../../../shared/models/colis.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { ResultScreenComponent } from '../../../shared/components/result-screen/result-screen.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { formatMoney } from '../../../shared/utils/money';

/** Écran « Livraison terminée ». */
@Component({
  selector: 'app-livraison-terminee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    RatingStarsComponent,
    ResultScreenComponent,
    RoundIconButtonComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './livraison.page.html',
  styleUrls: ['./livraison.page.scss'],
})
export class LivraisonTermineePage {
  private readonly colisService = inject(ColisService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly colis = signal<ColisDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger cette livraison.');

  readonly montantLabel = computed(() => {
    const colis = this.colis();
    return colis ? formatMoney(colis.montantLibere ?? colis.montant, colis.devise) : '';
  });

  readonly message = computed(() => {
    const voyageur = this.colis()?.voyageur?.displayName ?? '';
    return `La réception du colis a été confirmée. La rémunération de ${voyageur} est maintenant libérée.`;
  });

  /** L'utilisateur connecté est le voyageur de ce colis. */
  readonly estVoyageur = computed(() => this.colis()?.role === 'voyageur');

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/colis', this.id()]);
  }

  async evaluate(): Promise<void> {
    await this.router.navigate(['/colis', this.id(), 'evaluation']);
  }

  /** Charge le détail du colis. */
  load(): void {
    this.error.set(false);

    this.colisService.getColis(this.id()).subscribe({
      next: (colis) => {
        this.colis.set(colis);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger cette livraison.'
        );
        this.error.set(true);
      },
    });
  }
}
