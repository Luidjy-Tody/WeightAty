import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

/** Options d'une boîte de confirmation. */
export interface ConfirmOptions {
  header: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style rouge pour les actions irréversibles. */
  destructive?: boolean;
}

/** Options d'une confirmation par mot de passe. */
export interface ConfirmPasswordOptions {
  header: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
}

/**
 * Boîtes de dialogue de confirmation, réutilisables (déconnexion, suppression
 * de compte…). Retourne `true` si l'utilisateur confirme.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly alertController = inject(AlertController);

  /** Confirmation simple. */
  async ask(options: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertController.create({
      header: options.header,
      message: options.message,
      buttons: [
        { text: options.cancelLabel ?? 'Annuler', role: 'cancel' },
        {
          text: options.confirmLabel ?? 'Confirmer',
          role: options.destructive ? 'destructive' : 'confirm',
        },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    return role === 'confirm' || role === 'destructive';
  }

  /**
   * Double confirmation par saisie du mot de passe.
   * Retourne le mot de passe saisi, ou `null` si l'utilisateur annule.
   */
  async askPassword(options: ConfirmPasswordOptions): Promise<string | null> {
    const alert = await this.alertController.create({
      header: options.header,
      message: options.message,
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: options.placeholder ?? 'Votre mot de passe',
        },
      ],
      buttons: [
        { text: options.cancelLabel ?? 'Annuler', role: 'cancel' },
        { text: options.confirmLabel ?? 'Confirmer', role: 'destructive' },
      ],
    });

    await alert.present();
    const { role, data } = await alert.onDidDismiss<{ values?: { password?: string } }>();

    if (role !== 'destructive' && role !== 'confirm') {
      return null;
    }

    return data?.values?.['password'] ?? '';
  }
}
