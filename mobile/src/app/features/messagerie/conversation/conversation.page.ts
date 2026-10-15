import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MessageService } from '../../../core/services/message.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_UNREACHABLE_MESSAGE, apiErrorMessage, isApiUnreachable } from '../../../shared/models/api-error.model';
import type { ConversationDetail, Message } from '../../../shared/models/message.model';
import { formatStamp } from '../../../shared/utils/datetime';

/** Écran de conversation (messagerie minimale). */
@Component({
  selector: 'app-conversation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    IonButton,
    IonInput,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/messages" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>{{ conversation()?.peer?.displayName ?? 'Conversation' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="conversation-content" #content>
      @if (loading()) {
        <div class="state">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (error()) {
        <div class="state">
          <ion-icon class="state__icon" name="alert-circle-outline" aria-hidden="true"></ion-icon>
          <p class="state__message">{{ errorMessage() }}</p>
          <ion-button fill="solid" (click)="load()">Réessayer</ion-button>
        </div>
      } @else {
        <div class="thread">
          @for (message of messages(); track message.id) {
            <div [class]="'bubble ' + (message.estMoi ? 'bubble--mine' : 'bubble--theirs')">
              <p class="bubble__text">{{ message.contenu }}</p>
              <span class="bubble__date">{{ date(message) }}</span>
            </div>
          }

          @if (messages().length === 0) {
            <p class="thread__empty">
              Écrivez votre premier message pour convenir des détails de l'envoi.
            </p>
          }
        </div>
      }
    </ion-content>

    <footer class="composer">
      <ion-input
        class="composer__input"
        placeholder="Votre message…"
        [value]="draft()"
        [maxlength]="1000"
        enterkeyhint="send"
        (ionInput)="onDraft($event)"
        (keydown.enter)="send($event)"
      ></ion-input>

      <ion-button
        class="composer__send"
        fill="solid"
        [disabled]="sending() || draft().trim() === ''"
        aria-label="Envoyer le message"
        (click)="send()"
      >
        @if (sending()) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          <ion-icon name="send" aria-hidden="true"></ion-icon>
        }
      </ion-button>
    </footer>
  `,
  styles: [
    `
      .conversation-content {
        --background: var(--wat-bg);
        --padding-bottom: calc(96px + env(safe-area-inset-bottom));
      }

      .thread {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 560px;
        margin: 0 auto;
        padding: 18px 16px 8px;
      }

      .bubble {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 78%;
        padding: 10px 14px;
        border-radius: var(--wat-radius-md);
        font-size: 15px;
      }

      .bubble--mine {
        align-self: flex-end;
        background: var(--wat-emerald-500);
        color: #ffffff;
      }

      .bubble--theirs {
        align-self: flex-start;
        background: var(--wat-surface);
        border: 1px solid var(--wat-border);
        color: var(--wat-ink);
      }

      .bubble__text {
        margin: 0;
        overflow-wrap: anywhere;
      }

      .bubble__date {
        font-size: 11px;
        opacity: 0.75;
      }

      .thread__empty {
        margin: 0;
        padding: 24px 8px;
        color: var(--wat-muted);
        font-size: 14px;
        text-align: center;
      }

      .composer {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
        background: var(--wat-surface);
        border-top: 1px solid var(--wat-border);
      }

      .composer__input {
        flex: 1 1 auto;
        --background: var(--wat-bg);
        --border-radius: var(--wat-radius-md);
      }

      .composer__send {
        flex: 0 0 auto;
        width: 48px;
        min-height: 48px;
        margin: 0;
        --border-radius: 50%;
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
        font-size: 44px;
      }

      .state__message {
        margin: 0;
        font-size: 15px;
      }
    `,
  ],
})
export class ConversationPage {
  private readonly messageService = inject(MessageService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  private readonly content = viewChild<IonContent>('content');

  readonly conversation = signal<ConversationDetail | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly draft = signal('');
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger cette conversation.');

  /** Identifiant de la conversation (paramètre de route). */
  get id(): string {
    return String(this.route.snapshot.paramMap.get('id'));
  }

  ionViewWillEnter(): void {
    this.load();
  }

  date(message: Message): string {
    return formatStamp(message.createdAt);
  }

  onDraft(event: Event): void {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    this.draft.set(detail?.value ?? '');
  }

  /** Envoie le message saisi (Entrée ou bouton). */
  send(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const contenu = this.draft().trim();

    if (contenu === '' || this.sending()) {
      return;
    }

    this.sending.set(true);

    this.messageService.sendMessage(this.id, contenu).subscribe({
      next: (message) => {
        this.sending.set(false);
        this.draft.set('');
        this.messages.update((current) => [...current, message]);
        void this.scrollToBottom();
      },
      error: (error: unknown) => {
        this.sending.set(false);
        void this.notifications.error(
          apiErrorMessage(error, "L'envoi du message a échoué. Réessayez.")
        );
      },
    });
  }

  /** Charge la conversation et ses messages. */
  load(): void {
    this.error.set(false);

    this.messageService.getConversation(this.id).subscribe({
      next: (conversation) => {
        this.conversation.set(conversation);

        this.messageService.listMessages(this.id).subscribe({
          next: (items) => {
            this.messages.set(items);
            this.loading.set(false);
            void this.scrollToBottom();
          },
          error: (error: unknown) => {
            this.loading.set(false);
            this.errorMessage.set(
              isApiUnreachable(error)
                ? API_UNREACHABLE_MESSAGE
                : 'Impossible de charger cette conversation.'
            );
            this.error.set(true);
          },
        });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : apiErrorMessage(error, 'Impossible de charger cette conversation.')
        );
        this.error.set(true);
      },
    });
  }

  private async scrollToBottom(): Promise<void> {
    const content = this.content();
    if (content) {
      await content.scrollToBottom(150);
    }
  }
}
