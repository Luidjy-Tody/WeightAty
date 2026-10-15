import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ConversationDetail,
  ConversationListResponse,
  ConversationSummary,
  Message,
  MessageListResponse,
} from '../../shared/models/message.model';

/** Accès à la messagerie (conversations et messages). */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);

  /** Conversations de l'utilisateur connecté. */
  listConversations(): Observable<ConversationSummary[]> {
    return this.http
      .get<ConversationListResponse>(`${environment.apiUrl}/conversations`)
      .pipe(map((response) => response.items));
  }

  /** Retrouve ou crée la conversation avec un membre. */
  openConversation(userId: string): Observable<ConversationDetail> {
    return this.http.post<ConversationDetail>(`${environment.apiUrl}/conversations`, { userId });
  }

  /** Détail d'une conversation (interlocuteur). */
  getConversation(id: string): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${environment.apiUrl}/conversations/${id}`);
  }

  /** Messages d'une conversation. */
  listMessages(id: string): Observable<Message[]> {
    return this.http
      .get<MessageListResponse>(`${environment.apiUrl}/conversations/${id}/messages`)
      .pipe(map((response) => response.items));
  }

  /** Envoie un message. */
  sendMessage(id: string, contenu: string): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/conversations/${id}/messages`, {
      contenu,
    });
  }
}
