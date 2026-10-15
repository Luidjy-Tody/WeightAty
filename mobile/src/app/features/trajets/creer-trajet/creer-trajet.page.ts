import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { NotificationService } from '../../../core/services/notification.service';
import { TrajetService } from '../../../core/services/trajet.service';
import type { PendingChangesAware } from '../../../core/guards/unsaved-changes.guard';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  apiFieldErrors,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import type { CreateTrajetPayload } from '../../../shared/models/trajet.model';
import { PromoBannerComponent } from '../components/promo-banner/promo-banner.component';
import { TripFormComponent } from '../components/trip-form/trip-form.component';

/** Écran « Créer un trajet » : formulaire de publication d'un trajet. */
@Component({
  selector: 'app-creer-trajet',
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
    IonSpinner,
    PromoBannerComponent,
    TripFormComponent,
  ],
  templateUrl: './creer-trajet.page.html',
  styleUrls: ['./creer-trajet.page.scss'],
})
export class CreerTrajetPage implements PendingChangesAware {
  private readonly trajetService = inject(TrajetService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly notifications = inject(NotificationService);

  private readonly tripForm = viewChild(TripFormComponent);

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);

  /** Retour à la liste (la confirmation est gérée par le garde `canDeactivate`). */
  async goBack(): Promise<void> {
    await this.router.navigate(['/trajets']);
  }

  /** Déclenche la validation puis la soumission du formulaire. */
  submit(): void {
    this.tripForm()?.submit();
  }

  /** Publication du trajet. */
  onSubmitted(payload: CreateTrajetPayload): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.trajetService.createTrajet(payload).subscribe({
      next: () => void this.onSuccess(),
      error: (error: unknown) => {
        this.loading.set(false);

        // Erreurs de validation renvoyées par le serveur : affichées par champ.
        const details = apiFieldErrors(error);
        if (Object.keys(details).length > 0) {
          this.tripForm()?.applyServerErrors(details);
          return;
        }

        this.serverError.set(this.messageFor(error));
      },
    });
  }

  /** Confirmation si l'utilisateur quitte avec une saisie en cours. */
  async canDeactivate(): Promise<boolean> {
    const form = this.tripForm();

    if (!form || !form.isDirty() || this.loading()) {
      return true;
    }

    const alert = await this.alertController.create({
      header: 'Modifications non enregistrées',
      message: 'Voulez-vous vraiment quitter sans publier ce trajet ?',
      buttons: [
        { text: 'Continuer la saisie', role: 'cancel' },
        { text: 'Quitter', role: 'confirm' },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    return role === 'confirm';
  }

  private async onSuccess(): Promise<void> {
    this.loading.set(false);
    this.tripForm()?.markPristine();

    await this.notifications.success('Trajet publié avec succès');
    await this.router.navigateByUrl('/trajets', { replaceUrl: true });
  }

  /** Message d'erreur français adapté au type d'échec. */
  private messageFor(error: unknown): string {
    const status = (error as { status?: number } | null)?.status;

    if (status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
    }

    if (isApiUnreachable(error)) {
      return API_UNREACHABLE_MESSAGE;
    }

    return apiErrorMessage(error, 'La publication du trajet a échoué. Réessayez.');
  }
}
