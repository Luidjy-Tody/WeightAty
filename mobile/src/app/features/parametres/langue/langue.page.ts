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
import { LANGUAGES } from '../../../shared/models/preferences.model';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';

/** Sous-écran « Langue » : choix exclusif de la langue de l'interface. */
@Component({
  selector: 'app-langue',
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
  ],
  templateUrl: './langue.page.html',
  styleUrls: ['./langue.page.scss'],
})
export class LanguePage {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly languages = LANGUAGES;
  readonly current = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger votre langue.');

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/parametres']);
  }

  /** Change la langue (mise à jour optimiste, enregistrée en base). */
  select(code: string): void {
    const previous = this.current();

    if (code === previous) {
      return;
    }

    this.current.set(code);

    this.userService.updatePreferences({ language: code }).subscribe({
      next: (preferences) => {
        this.current.set(preferences.language);
        void this.notifications.success('Langue enregistrée.');
      },
      error: (error: unknown) => {
        this.current.set(previous);
        void this.notifications.error(
          apiErrorMessage(error, "L'enregistrement de la langue a échoué. Réessayez.")
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
        this.current.set(preferences.language);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger votre langue.'
        );
        this.error.set(true);
      },
    });
  }
}
