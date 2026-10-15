import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { MenuItemComponent } from '../../shared/components/menu-list/menu-item.component';
import { MenuListComponent } from '../../shared/components/menu-list/menu-list.component';
import { ProfilHeaderComponent } from './components/profil-header/profil-header.component';
import { ReviewCardComponent } from './components/review-card/review-card.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import type { Profile } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { LogoutService } from '../../core/services/logout.service';
import { UserService } from '../../core/services/user.service';
import { countLabel } from '../../shared/utils/plural';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';

/** Élément du menu « Mon profil ». */
interface MenuEntry {
  icon: string;
  title: string;
  subtitle: string;
  link: string;
}

/** Page « Mon profil » : consultation des informations et statistiques. */
@Component({
  selector: 'app-profil',
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
    RouterLink,
    ProfilHeaderComponent,
    StatsCardComponent,
    MenuListComponent,
    MenuItemComponent,
    ReviewCardComponent,
    BottomNavComponent,
  ],
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
})
export class ProfilPage {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly logoutService = inject(LogoutService);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger votre profil. Vérifiez votre connexion.');

  /** Lignes du menu, dont les sous-titres dépendent des statistiques. */
  readonly menu = computed<MenuEntry[]>(() => {
    const stats = this.profile()?.stats;

    return [
      {
        icon: 'person-circle-outline',
        title: 'Mes informations',
        subtitle: 'Coordonnées et identité',
        link: '/profil/mes-informations',
      },
      {
        icon: 'airplane-outline',
        title: 'Mes trajets',
        subtitle: countLabel(stats?.trajets ?? 0, 'trajet publié', 'trajets publiés'),
        link: '/trajets',
      },
      {
        icon: 'cube-outline',
        title: 'Mes colis',
        subtitle: `${stats?.colisEnCours ?? 0} en cours`,
        link: '/colis',
      },
      {
        icon: 'card-outline',
        title: 'Mes paiements',
        subtitle: 'Historique et moyens',
        link: '/paiement',
      },
      {
        icon: 'star-outline',
        title: 'Mes évaluations',
        subtitle: `${stats?.avis ?? 0} avis`,
        link: '/profil/avis',
      },
      {
        icon: 'settings-outline',
        title: 'Paramètres',
        subtitle: 'Sécurité et préférences',
        link: '/parametres',
      },
    ];
  });

  ionViewWillEnter(): void {
    this.loadProfile();
  }

  /** Recharge le profil depuis l'API. */
  private loadProfile(done?: () => void): void {
    this.error.set(false);

    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.auth.setCurrentUser(profile);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger votre profil. Vérifiez votre connexion.'
        );
        this.error.set(true);
        done?.();
      },
    });
  }

  /** Réessaie le chargement après une erreur. */
  retry(): void {
    this.loading.set(true);
    this.loadProfile();
  }

  /** Gestion du pull-to-refresh. */
  refresh(event: Event): void {
    const refresher = event.target as unknown as { complete: () => Promise<void> };
    this.loadProfile(() => void refresher.complete());
  }

  /** Demande confirmation puis déconnecte l'utilisateur (logique partagée). */
  async confirmLogout(): Promise<void> {
    await this.logoutService.confirmAndLogout();
  }
}
