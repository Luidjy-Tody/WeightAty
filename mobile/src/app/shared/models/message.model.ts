import type { PublicUserSummary } from './trajet.model';

/** Conversation de la messagerie. */
export interface ConversationSummary {
  id: string;
  peer: PublicUserSummary;
  dernierMessage: string | null;
  updatedAt: string;
}

/** Conversation avec son interlocuteur. */
export interface ConversationDetail {
  id: string;
  peer: PublicUserSummary;
}

/** Message d'une conversation. */
export interface Message {
  id: string;
  auteurId: string;
  contenu: string;
  estMoi: boolean;
  createdAt: string;
}

export interface ConversationListResponse {
  items: ConversationSummary[];
}

export interface MessageListResponse {
  items: Message[];
}
