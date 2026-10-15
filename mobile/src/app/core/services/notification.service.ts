import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

/** Affichage de messages temporaires (toasts) en français. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastController = inject(ToastController);

  /** Affiche un toast de succès. */
  async success(message: string): Promise<void> {
    await this.show(message, 'success');
  }

  /** Affiche un toast d'erreur. */
  async error(message: string): Promise<void> {
    await this.show(message, 'danger');
  }

  private async show(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'bottom',
      buttons: [{ text: 'Fermer', role: 'cancel' }],
    });

    await toast.present();
  }
}
