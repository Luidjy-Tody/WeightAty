import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
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
import { ColisService } from '../../../core/services/colis.service';
import { MessageService } from '../../../core/services/message.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import type { ColisDetail } from '../../../shared/models/colis.model';
import { RouteLineComponent } from '../../../shared/components/route-line/route-line.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TrackingTimelineComponent } from '../../../shared/components/tracking-timeline/tracking-timeline.component';
import { TravelerCardComponent } from '../../../shared/components/traveler-card/traveler-card.component';
import { formatArrivalLabel } from '../../../shared/utils/datetime';
import { colisBadge } from '../../../shared/utils/status';

/** Intervalle de rafraîchissement automatique du suivi (ms). */
const AUTO_REFRESH_MS = 30_000;

/** Écran « Suivi du colis ». */
@Component({
  selector: 'app-suivi-colis',
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
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    RouteLineComponent,
    RoundIconButtonComponent,
    StatusBadgeComponent,
    TrackingTimelineComponent,
    TravelerCardComponent,
  ],
  templateUrl: './suivi.page.html',
  styleUrls: ['./suivi.page.scss'],
})
export class SuiviColisPage {
  private readonly colisService = inject(ColisService);
  private readonly messageService = inject(MessageService);
  private readonly notifications = inject(NotificationService);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  /** Identifiant du colis (paramètre de route). */
  readonly id = input.required<string>();

  readonly colis = signal<ColisDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger ce colis.');
  readonly confirming = signal(false);
  readonly contacting = signal(false);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly badge = computed(() => {
    const colis = this.colis();
    return colis ? colisBadge(colis.statut) : { label: '', tone: 'neutral' as const };
  });

  readonly arrivalLabel = computed(() => formatArrivalLabel(this.colis()?.dateArriveePrevue ?? null));

  readonly isDelivered = computed(() => this.colis()?.statut === 'livre');

  /** La barre d'action n'apparaît que lorsqu'une action est possible. */
  readonly showActionBar = computed(
    () => this.isDelivered() || this.colis()?.peutConfirmerLivraison === true
  );

  ionViewWillEnter(): void {
    this.load();
  }

  ionViewDidEnter(): void {
    this.startAutoRefresh();
  }

  ionViewWillLeave(): void {
    this.stopAutoRefresh();
  }

  /** Retour à la liste des colis. */
  async goBack(): Promise<void> {
    await this.router.navigate(['/colis']);
  }

  /** Charge (ou rafraîchit) le suivi. */
  private load(done?: () => void, silent = false): void {
    if (!silent) {
      this.error.set(false);
    }

    this.colisService.getColis(this.id()).subscribe({
      next: (colis) => {
        this.colis.set(colis);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);

        if (!silent) {
          this.errorMessage.set(
            isApiUnreachable(error) ? API_UNREACHABLE_MESSAGE : 'Impossible de charger ce colis.'
          );
          this.error.set(true);
        }

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

  /** Menu « … » du suivi. */
  async openMenu(): Promise<void> {
    const colis = this.colis();

    if (!colis) {
      return;
    }

    const buttons = [
      ...(colis.voyageur
        ? [
            {
              text: 'Contacter le voyageur',
              handler: () => void this.contact(),
            },
          ]
        : []),
      {
        text: 'Signaler un problème',
        role: 'destructive' as const,
        handler: () => void this.router.navigate(['/signaler', 'colis', colis.id]),
      },
      { text: 'Annuler', role: 'cancel' as const },
    ];

    const sheet = await this.actionSheet.create({ header: 'Options du colis', buttons });
    await sheet.present();
  }

  /** Ouvre la conversation avec le voyageur. */
  async contact(): Promise<void> {
    const voyageur = this.colis()?.voyageur;

    if (!voyageur || this.contacting()) {
      return;
    }

    this.contacting.set(true);

    this.messageService.openConversation(voyageur.id).subscribe({
      next: (conversation) => {
        this.contacting.set(false);
        void this.router.navigate(['/messages', conversation.id]);
      },
      error: (error: unknown) => {
        this.contacting.set(false);
        void this.notifications.error(
          apiErrorMessage(error, 'Impossible de contacter le voyageur pour le moment.')
        );
      },
    });
  }

  /** Confirme la remise au destinataire (expéditeur) et libère la rémunération. */
  async confirmDelivery(): Promise<void> {
    const colis = this.colis();

    if (!colis || this.confirming()) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmer la réception',
      message:
        'Confirmez-vous avoir bien reçu le colis ? La rémunération du voyageur sera alors libérée.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          role: 'confirm',
          handler: () => void this.runConfirm(colis.id),
        },
      ],
    });

    await alert.present();
  }

  /** Ouvre l'écran « Livraison terminée ». */
  async openDelivery(): Promise<void> {
    await this.router.navigate(['/colis', this.id(), 'livraison']);
  }

  private runConfirm(colisId: string): void {
    this.confirming.set(true);

    this.colisService.confirmDelivery(colisId).subscribe({
      next: async (colis) => {
        this.confirming.set(false);
        this.colis.set(colis);
        await this.notifications.success('Réception confirmée, rémunération libérée.');
        await this.router.navigate(['/colis', colisId, 'livraison']);
      },
      error: (error: unknown) => {
        this.confirming.set(false);
        void this.notifications.error(
          apiErrorMessage(error, 'La confirmation a échoué. Réessayez.')
        );
      },
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => this.load(undefined, true), AUTO_REFRESH_MS);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
