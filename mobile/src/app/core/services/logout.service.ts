import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { NotificationService } from './notification.service';

/**
 * Déconnexion de l'utilisateur, partagée par tous les écrans :
 * confirmation, révocation du jeton côté serveur, nettoyage du stockage local
 * et redirection définitive vers l'écran de connexion.
 */
@Injectable({ providedIn: 'root' })
export class LogoutService {
  private readonly auth = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Demande confirmation puis déconnecte. Retourne `false` si annulé. */
  async confirmAndLogout(): Promise<boolean> {
    const confirmed = await this.confirmDialog.ask({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      confirmLabel: 'Se déconnecter',
      cancelLabel: 'Annuler',
      destructive: true,
    });

    if (!confirmed) {
      return false;
    }

    await this.logout();
    return true;
  }

  /**
   * Déconnexion sans confirmation (compte supprimé par exemple).
   * Le jeton est révoqué côté serveur, la session locale et l'utilisateur en
   * mémoire sont effacés, puis l'application revient à l'écran de connexion
   * sans possibilité de retour arrière.
   */
  async logout(): Promise<void> {
    this.auth.logout();

    await this.notifications.success('Vous êtes déconnecté.');
    await this.router.navigateByUrl('/auth/connexion', { replaceUrl: true });
  }
}
