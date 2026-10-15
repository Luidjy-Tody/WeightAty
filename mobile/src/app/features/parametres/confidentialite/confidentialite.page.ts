import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { LogoutService } from '../../../core/services/logout.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import type { PrivacyPreferences } from '../../../shared/models/preferences.model';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { ToggleRowComponent } from '../../../shared/components/toggle-row/toggle-row.component';

type PrivacyKey = keyof PrivacyPreferences;

/** Sous-écran « Confidentialité » : visibilité et données personnelles. */
@Component({
  selector: 'app-confidentialite',
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
    IonSkeletonText,
    RoundIconButtonComponent,
    ToggleRowComponent,
  ],
  templateUrl: './confidentialite.page.html',
  styleUrls: ['./confidentialite.page.scss'],
})
export class ConfidentialitePage {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly logoutService = inject(LogoutService);
  private readonly router = inject(Router);

  readonly preferences = signal<PrivacyPreferences | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos préférences.');
  readonly deleting = signal(false);

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/parametres']);
  }

  /** Enregistrement automatique avec mise à jour optimiste. */
  toggle(key: PrivacyKey, value: boolean): void {
    const previous = this.preferences();

    if (!previous) {
      return;
    }

    const next: PrivacyPreferences = { ...previous, [key]: value };
    this.preferences.set(next);

    this.userService.updatePreferences({ privacy: next }).subscribe({
      next: (preferences) => this.preferences.set(preferences.privacy),
      error: (error: unknown) => {
        this.preferences.set(previous);
        void this.notifications.error(
          apiErrorMessage(error, "L'enregistrement a échoué. Votre choix n'a pas été appliqué.")
        );
      },
    });
  }

  /**
   * Suppression du compte : double confirmation (avertissement puis saisie du
   * mot de passe). Le serveur refuse si un colis ou un trajet est en cours.
   */
  async deleteAccount(): Promise<void> {
    if (this.deleting()) {
      return;
    }

    const warned = await this.confirmDialog.ask({
      header: 'Supprimer mon compte',
      message:
        'Cette action est définitive : votre identité sera effacée. Vos paiements et avis sont conservés de façon anonyme.',
      confirmLabel: 'Continuer',
      destructive: true,
    });

    if (!warned) {
      return;
    }

    const password = await this.confirmDialog.askPassword({
      header: 'Confirmer la suppression',
      message: 'Saisissez votre mot de passe pour confirmer la suppression définitive.',
      confirmLabel: 'Supprimer mon compte',
    });

    if (password === null) {
      return;
    }

    this.deleting.set(true);

    this.userService.deleteAccount(password).subscribe({
      next: async () => {
        this.deleting.set(false);
        await this.notifications.success('Votre compte a été supprimé.');
        await this.logoutService.logout();
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        void this.notifications.error(
          apiErrorMessage(error, 'La suppression du compte a échoué.')
        );
      },
    });
  }

  retry(): void {
    this.loading.set(true);
    this.load();
  }

  private load(): void {
    this.error.set(false);

    this.userService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferences.set(preferences.privacy);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos préférences.'
        );
        this.error.set(true);
      }
    });
  }
}
