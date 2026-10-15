import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MessageService } from '../../../core/services/message.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TrajetService } from '../../../core/services/trajet.service';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import { TRAJET_POLICY_ITEMS, type TrajetDetail } from '../../../shared/models/trajet.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { TravelerHeaderComponent } from '../../../shared/components/traveler-header/traveler-header.component';
import { TripSummaryCardComponent } from '../../../shared/components/trip-summary-card/trip-summary-card.component';
import { trajetBadge } from '../../../shared/utils/status';

/** Écran « Détails du trajet ». */
@Component({
  selector: 'app-detail-trajet',
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
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    StatusBadgeComponent,
    RoundIconButtonComponent,
    TravelerHeaderComponent,
    TripSummaryCardComponent,
  ],
  templateUrl: './detail-trajet.page.html',
  styleUrls: ['./detail-trajet.page.scss'],
})
export class DetailTrajetPage {
  private readonly trajetService = inject(TrajetService);
  private readonly messageService = inject(MessageService);
  private readonly notifications = inject(NotificationService);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  /** Identifiant du trajet (paramètre de route). */
  readonly id = input.required<string>();

  readonly trajet = signal<TrajetDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger ce trajet.');
  readonly contacting = signal(false);

  readonly policyItems = TRAJET_POLICY_ITEMS;

  readonly badge = computed(() => {
    const trajet = this.trajet();
    return trajet ? trajetBadge(trajet.statut) : { label: '', tone: 'neutral' as const };
  });

  /** Texte « À propos » construit à partir des données réelles du voyageur. */
  readonly aboutText = computed(() => {
    const voyageur = this.trajet()?.voyageur;

    if (!voyageur) {
      return '';
    }

    const parts: string[] = [];

    if (voyageur.isVerified) {
      parts.push('Voyageur vérifié');
    }

    // Le nombre de voyages n'est mentionné que si le voyageur l'a rendu visible.
    if (voyageur.voyagesVisibles) {
      parts.push(
        voyageur.nombreVoyages > 1
          ? `${voyageur.nombreVoyages} voyages réalisés`
          : `${voyageur.nombreVoyages} voyage réalisé`
      );
    }

    if (voyageur.nombreAvis > 0) {
      parts.push(
        `${voyageur.noteMoyenne.toFixed(1)} de note moyenne sur ${voyageur.nombreAvis} avis`
      );
    }

    return parts.length > 0 ? `${parts.join('. ')}.` : '';
  });

  /** Libellé du bouton principal selon l'état du trajet. */
  readonly requestLabel = computed(() => {
    const trajet = this.trajet();

    if (!trajet) {
      return 'Faire une demande';
    }

    switch (trajet.statut) {
      case 'complet':
        return 'Trajet complet';
      case 'termine':
        return 'Trajet terminé';
      case 'annule':
        return 'Trajet annulé';
      default:
        return 'Faire une demande';
    }
  });

  ionViewWillEnter(): void {
    this.load();
  }

  /** Retour à la liste des trajets publiés. */
  async goBack(): Promise<void> {
    await this.router.navigate(['/trajets']);
  }

  /** Charge le détail du trajet. */
  private load(done?: () => void): void {
    this.error.set(false);

    this.trajetService.getTrajet(this.id()).subscribe({
      next: (trajet) => {
        this.trajet.set(trajet);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error) ? API_UNREACHABLE_MESSAGE : 'Impossible de charger ce trajet.'
        );
        this.error.set(true);
        done?.();
      },
    });
  }

  retry(): void {
    this.loading.set(true);
    this.load();
  }

  refresh(event: Event): void {
    const refresher = event.target as unknown as { complete: () => Promise<void> };
    this.load(() => void refresher.complete());
  }

  /** Menu « … » : signaler ou contacter le voyageur. */
  async openMenu(): Promise<void> {
    const trajet = this.trajet();

    if (!trajet) {
      return;
    }

    const buttons = [
      ...(trajet.estProprietaire
        ? []
        : [
            {
              text: 'Contacter le voyageur',
              handler: () => void this.contact(),
            },
            {
              text: 'Voir les avis du voyageur',
              handler: () => void this.router.navigate(['/avis', trajet.voyageur.id]),
            },
          ]),
      {
        text: 'Signaler un problème',
        role: 'destructive' as const,
        handler: () => void this.router.navigate(['/signaler', 'trajet', trajet.id]),
      },
      { text: 'Annuler', role: 'cancel' as const },
    ];

    const sheet = await this.actionSheet.create({
      header: 'Options du trajet',
      buttons,
    });

    await sheet.present();
  }

  /** Ouvre (ou crée) la conversation avec le voyageur. */
  async contact(): Promise<void> {
    const trajet = this.trajet();

    if (!trajet || this.contacting()) {
      return;
    }

    this.contacting.set(true);

    this.messageService.openConversation(trajet.voyageur.id).subscribe({
      next: (conversation) => {
        this.contacting.set(false);
        void this.router.navigate(['/messages', conversation.id]);
      },
      error: (error: unknown) => {
        this.contacting.set(false);
        void this.notifications.error(
          apiErrorMessage(error, 'Impossible de contacter ce voyageur pour le moment.')
        );
      },
    });
  }

  /** Fait une demande d'envoi sur ce trajet. */
  async requestTrip(): Promise<void> {
    const trajet = this.trajet();

    if (!trajet || !trajet.peutFaireDemande) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Faire une demande',
      message:
        'Le formulaire de demande d’envoi arrive bientôt. Vous pouvez déjà contacter le voyageur pour convenir des détails.',
      buttons: [
        { text: 'Fermer', role: 'cancel' },
        { text: 'Contacter', handler: () => void this.contact() },
      ],
    });

    await alert.present();
  }
}
