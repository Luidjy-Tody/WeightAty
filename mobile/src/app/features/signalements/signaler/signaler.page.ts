import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { NotificationService } from '../../../core/services/notification.service';
import { SignalementService } from '../../../core/services/signalement.service';
import { apiErrorMessage } from '../../../shared/models/api-error.model';
import {
  SIGNALEMENT_MESSAGE_MAX,
  SIGNALEMENT_MOTIFS,
} from '../../../shared/models/signalement.model';

/** Écran minimal de signalement d'un trajet ou d'un colis. */
@Component({
  selector: 'app-signaler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
  ],
  templateUrl: './signaler.page.html',
  styleUrls: ['./signaler.page.scss'],
})
export class SignalerPage {
  private readonly signalementService = inject(SignalementService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  /** Type de la ressource signalée : « trajet » ou « colis ». */
  readonly type = input.required<string>();
  readonly id = input.required<string>();

  readonly motifs = SIGNALEMENT_MOTIFS;
  readonly messageMax = SIGNALEMENT_MESSAGE_MAX;

  readonly motif = signal('');
  readonly message = signal('');
  readonly submitting = signal(false);

  readonly canSubmit = computed(() => this.motif() !== '' && !this.submitting());

  onMotif(event: Event): void {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    this.motif.set(detail?.value ?? '');
  }

  onMessage(event: Event): void {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    this.message.set(detail?.value ?? '');
  }

  /** Enregistre le signalement. */
  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);

    this.signalementService
      .create({
        cibleType: this.type() === 'colis' ? 'colis' : 'trajet',
        cibleId: this.id(),
        motif: this.motif(),
        message: this.message().trim() || null,
      })
      .subscribe({
        next: async () => {
          this.submitting.set(false);
          await this.notifications.success('Signalement envoyé. Merci pour votre retour.');
          await this.router.navigate(['/profil']);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          void this.notifications.error(
            apiErrorMessage(error, "L'envoi du signalement a échoué. Réessayez.")
          );
        },
      });
  }
}
