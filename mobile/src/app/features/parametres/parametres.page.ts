import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { LogoutService } from '../../core/services/logout.service';
import { UserService } from '../../core/services/user.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import { languageLabel, type UserPreferences } from '../../shared/models/preferences.model';
import { MenuItemComponent } from '../../shared/components/menu-list/menu-item.component';
import { MenuListComponent } from '../../shared/components/menu-list/menu-list.component';
import { RoundIconButtonComponent } from '../../shared/components/round-icon-button/round-icon-button.component';

/** Écran « Paramètres » : accès aux préférences du compte et déconnexion. */
@Component({
  selector: 'app-parametres',
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
    MenuListComponent,
    MenuItemComponent,
    RoundIconButtonComponent,
  ],
  templateUrl: './parametres.page.html',
  styleUrls: ['./parametres.page.scss'],
})
export class ParametresPage {
  private readonly userService = inject(UserService);
  private readonly logoutService = inject(LogoutService);
  private readonly router = inject(Router);

  readonly preferences = signal<UserPreferences | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos paramètres.');

  /** Sous-titre dynamique de la ligne « Langue ». */
  readonly currentLanguage = computed(() => languageLabel(this.preferences()?.language));

  ionViewWillEnter(): void {
    this.load();
  }

  /** Retour à la page « Mon profil ». */
  async goBack(): Promise<void> {
    await this.router.navigate(['/profil']);
  }

  /** Déconnexion (logique partagée avec « Mon profil »). */
  async logout(): Promise<void> {
    await this.logoutService.confirmAndLogout();
  }

  retry(): void {
    this.loading.set(true);
    this.load();
  }

  private load(): void {
    this.error.set(false);

    this.userService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferences.set(preferences);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos paramètres.'
        );
        this.error.set(true);
      },
    });
  }
}
