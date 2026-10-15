import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage, API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../../shared/models/api-error.model';
import type { DemoAccount, DemoRole, LoginCredentials, User } from '../../../shared/models/user.model';
import { homeRouteForRole } from '../../../shared/utils/role-routing';
import { BrandHeaderComponent } from './components/brand-header/brand-header.component';
import { DemoAccessComponent } from './components/demo-access/demo-access.component';
import { LoginFormComponent } from './components/login-form/login-form.component';

/**
 * Écran de connexion : marque, carte de connexion et accès démonstration.
 */
@Component({
  selector: 'app-connexion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonContent,
    IonButton,
    BrandHeaderComponent,
    LoginFormComponent,
    DemoAccessComponent,
  ],
  templateUrl: './connexion.page.html',
  styleUrls: ['./connexion.page.scss'],
})
export class ConnexionPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly demoAccounts = signal<DemoAccount[]>([]);
  readonly demoBusyRole = signal<DemoRole | null>(null);

  constructor() {
    // Une session déjà valide ne doit pas repasser par l'écran de connexion.
    const user = this.auth.currentUser();

    if (user) {
      void this.router.navigateByUrl(this.destinationFor(user), { replaceUrl: true });
    } else if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.returnUrl(), { replaceUrl: true });
    }
  }

  ngOnInit(): void {
    // La section démo est masquée si aucun compte n'est disponible.
    this.auth.getDemoAccounts().subscribe({
      next: (response) => this.demoAccounts.set(response.accounts),
      error: () => this.demoAccounts.set([]),
    });
  }

  /** Connexion par e-mail et mot de passe. */
  onLogin(credentials: LoginCredentials): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.login(credentials.email, credentials.password).subscribe({
      next: (user) => void this.afterLogin(user),
      error: (error: unknown) => {
        this.loading.set(false);
        this.serverError.set(this.messageFor(error));
      },
    });
  }

  /** Connexion immédiate avec un compte de démonstration. */
  onDemoSelect(role: DemoRole): void {
    if (this.demoBusyRole() !== null) {
      return;
    }

    this.demoBusyRole.set(role);
    this.serverError.set(null);

    this.auth.demoLogin(role).subscribe({
      next: (user) => void this.afterLogin(user),
      error: (error: unknown) => {
        this.demoBusyRole.set(null);
        this.serverError.set(this.messageFor(error));
      },
    });
  }

  /** Redirige vers l'écran d'accueil correspondant au rôle. */
  private async afterLogin(user: User): Promise<void> {
    this.loading.set(false);
    this.demoBusyRole.set(null);
    await this.router.navigateByUrl(this.destinationFor(user), { replaceUrl: true });
  }

  /** Destination après connexion : rôle d'abord, puis éventuel retour. */
  private destinationFor(user: User): string {
    if (user.role === 'administrateur') {
      return homeRouteForRole(user.role);
    }
    return this.returnUrl();
  }

  /** Page demandée avant la redirection vers la connexion. */
  private returnUrl(): string {
    const retour = this.route.snapshot.queryParamMap.get('retour');

    if (retour && retour.startsWith('/') && !retour.startsWith('/auth/connexion')) {
      return retour;
    }

    return '/profil';
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

    if (error instanceof HttpErrorResponse && error.status >= 500) {
      return 'Le serveur est momentanément indisponible. Réessayez plus tard.';
    }

    return apiErrorMessage(error, 'Connexion impossible. Réessayez.');
  }
}
