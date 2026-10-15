import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { ColisService } from '../../../core/services/colis.service';
import { API_UNREACHABLE_MESSAGE, apiErrorMessage, isApiUnreachable } from '../../../shared/models/api-error.model';
import type { Remuneration } from '../../../shared/models/colis.model';
import { ResultScreenComponent } from '../../../shared/components/result-screen/result-screen.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { formatMoney } from '../../../shared/utils/money';

/** Écran « Rémunération libérée » (vue du voyageur). */
@Component({
  selector: 'app-remuneration',
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
    ResultScreenComponent,
    RoundIconButtonComponent,
  ],
  templateUrl: './remuneration.page.html',
  styleUrls: ['./remuneration.page.scss'],
})
export class RemunerationPage {
  private readonly colisService = inject(ColisService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly remuneration = signal<Remuneration | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger cette rémunération.');

  readonly montantLabel = computed(() => {
    const remuneration = this.remuneration();
    return remuneration ? formatMoney(remuneration.montant, remuneration.devise) : '';
  });

  readonly soldeLabel = computed(() => {
    const remuneration = this.remuneration();
    return remuneration ? formatMoney(remuneration.solde, remuneration.deviseSolde) : '';
  });

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/colis']);
  }

  /** Charge la rémunération du colis. */
  load(): void {
    this.error.set(false);

    this.colisService.getRemuneration(this.id()).subscribe({
      next: (remuneration) => {
        this.remuneration.set(remuneration);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : apiErrorMessage(error, 'Impossible de charger cette rémunération.')
        );
        this.error.set(true);
      },
    });
  }
}
