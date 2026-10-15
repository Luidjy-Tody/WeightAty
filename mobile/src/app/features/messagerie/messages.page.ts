import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MessageService } from '../../core/services/message.service';
import { API_UNREACHABLE_MESSAGE, isApiUnreachable } from '../../shared/models/api-error.model';
import type { ConversationSummary } from '../../shared/models/message.model';
import { formatStamp } from '../../shared/utils/datetime';

/** Écran « Messages » : liste des conversations (messagerie minimale). */
@Component({
  selector: 'app-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/profil" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Messages</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="messages-content">
      @if (loading()) {
        <div class="state">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (error()) {
        <div class="state">
          <ion-icon class="state__icon" name="alert-circle-outline" aria-hidden="true"></ion-icon>
          <p class="state__message">{{ errorMessage() }}</p>
          <ion-button fill="solid" (click)="retry()">Réessayer</ion-button>
        </div>
      } @else if (conversations().length > 0) {
        <div class="list">
          @for (item of conversations(); track item.id) {
            <a class="conversation" [routerLink]="['/messages', item.id]">
              <span class="conversation__main">
                <span class="conversation__name">{{ item.peer.displayName }}</span>
                <span class="conversation__preview">
                  {{ item.dernierMessage ?? 'Nouvelle conversation' }}
                </span>
              </span>
              <span class="conversation__date">{{ date(item) }}</span>
            </a>
          }
        </div>
      } @else {
        <div class="state">
          <ion-icon class="state__icon" name="chatbubble-ellipses-outline" aria-hidden="true"></ion-icon>
          <p class="state__message">
            Aucune conversation. Contactez un voyageur depuis un trajet ou un colis.
          </p>
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .messages-content {
        --background: var(--wat-bg);
        --padding-bottom: calc(24px + env(safe-area-inset-bottom));
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 560px;
        margin: 0 auto;
        padding: 18px 16px 8px;
      }

      .conversation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        background: var(--wat-surface);
        border: 1px solid var(--wat-border);
        border-radius: var(--wat-radius-lg);
        box-shadow: var(--wat-shadow-card);
        text-decoration: none;
        color: inherit;
      }

      .conversation__main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .conversation__name {
        color: var(--wat-ink);
        font-size: 15px;
        font-weight: 700;
      }

      .conversation__preview {
        overflow: hidden;
        color: var(--wat-muted);
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conversation__date {
        flex: 0 0 auto;
        color: var(--wat-muted);
        font-size: 12px;
      }

      .state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 72px 32px;
        text-align: center;
        color: var(--wat-muted);
      }

      .state__icon {
        color: var(--wat-emerald-500);
        font-size: 46px;
      }

      .state__message {
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
      }
    `,
  ],
})
export class MessagesPage {
  private readonly messageService = inject(MessageService);

  readonly conversations = signal<ConversationSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger vos conversations.');

  ionViewWillEnter(): void {
    this.load();
  }

  date(conversation: ConversationSummary): string {
    return formatStamp(conversation.updatedAt);
  }

  retry(): void {
    this.loading.set(true);
    this.load();
  }

  private load(): void {
    this.error.set(false);

    this.messageService.listConversations().subscribe({
      next: (items) => {
        this.conversations.set(items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos conversations.'
        );
        this.error.set(true);
      },
    });
  }
}
