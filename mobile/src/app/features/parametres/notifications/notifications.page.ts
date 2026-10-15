import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import type { NotificationPreferences } from '../../../shared/models/preferences.model';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { ToggleRowComponent } from '../../../shared/components/toggle-row/toggle-row.component';

type NotificationKey = keyof NotificationPreferences;

/** Sous-écran « Notifications » : préférences enregistrées automatiquement. */
@Component({
  selector: 'app-notifications-parametres',
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
    IonSkeletonText,
    RoundIconButtonComponent,
    ToggleRowComponent,
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly preferences = signal<NotificationPreferences | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos préférences.');

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/parametres']);
  }

  /**
   * Enregistrement automatique : la préférence est appliquée immédiatement
   * (mise à jour optimiste) puis confirmée par l'API ; en cas d'échec, la
   * valeur précédente est rétablie et un message est affiché.
   */
  toggle(key: NotificationKey, value: boolean): void {
    const previous = this.preferences();

    if (!previous) {
      return;
    }

    const next: NotificationPreferences = { ...previous, [key]: value };
    this.preferences.set(next);

    this.userService.updatePreferences({ notifications: next }).subscribe({
      next: (preferences) => this.preferences.set(preferences.notifications),
      error: (error: unknown) => {
        this.preferences.set(previous);
        void this.notifications.error(
          apiErrorMessage(error, "L'enregistrement a échoué. Votre choix n'a pas été appliqué.")
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
        this.preferences.set(preferences.notifications);
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
      },
    });
  }
}
