import { pool } from '../../config/database.js';
import { forbidden, notFound, validationError } from '../../utils/http-error.js';
import { findUserById, getPublicUserSummary, type PublicUserSummary } from '../users/user.service.js';

/** Nombre maximal de messages renvoyés dans une conversation. */
const MESSAGES_PAGE_SIZE = 100;

export interface PublicMessage {
  id: string;
  auteurId: string;
  contenu: string;
  estMoi: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  peer: PublicUserSummary;
  dernierMessage: string | null;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  peer: PublicUserSummary;
}

interface ConversationRow {
  id: string;
  peer_id: string;
  dernier_message: string | null;
  updated_at: Date;
}

interface MessageRow {
  id: string;
  auteur_id: string;
  contenu: string;
  created_at: Date;
}

/** Vérifie que l'utilisateur participe bien à la conversation. */
async function assertMember(userId: string, conversationId: string): Promise<string> {
  const result = await pool.query<{ user_a_id: string; user_b_id: string }>(
    'SELECT user_a_id, user_b_id FROM conversations WHERE id = $1',
    [conversationId]
  );

  const row = result.rows[0];

  if (!row) {
    throw notFound('Conversation introuvable.');
  }

  if (row.user_a_id !== userId && row.user_b_id !== userId) {
    throw forbidden("Vous n'avez pas accès à cette conversation.");
  }

  return row.user_a_id === userId ? row.user_b_id : row.user_a_id;
}

/** Retrouve (ou crée) la conversation entre l'utilisateur connecté et un membre. */
export async function findOrCreateConversation(
  userId: string,
  peerId: string
): Promise<ConversationDetail> {
  if (userId === peerId) {
    throw validationError({ userId: 'Vous ne pouvez pas vous contacter vous-même.' });
  }

  const peer = await findUserById(peerId);

  if (!peer) {
    throw notFound('Utilisateur introuvable.');
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO conversations (user_a_id, user_b_id)
     VALUES ($1, $2)
     ON CONFLICT (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id)) DO NOTHING
     RETURNING id`,
    [userId, peerId]
  );

  const conversationId =
    inserted.rows[0]?.id ??
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM conversations
          WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)
          LIMIT 1`,
        [userId, peerId]
      )
    ).rows[0]?.id;

  const summary = await getPublicUserSummary(peerId);

  if (!conversationId || !summary) {
    throw new Error('La conversation est introuvable.');
  }

  return { id: conversationId, peer: summary };
}

/** Conversations de l'utilisateur connecté (les plus récentes d'abord). */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const result = await pool.query<ConversationRow>(
    `SELECT c.id,
            CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END AS peer_id,
            c.updated_at,
            (SELECT m.contenu FROM messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.created_at DESC LIMIT 1) AS dernier_message
       FROM conversations c
      WHERE c.user_a_id = $1 OR c.user_b_id = $1
      ORDER BY c.updated_at DESC`,
    [userId]
  );

  const items = await Promise.all(
    result.rows.map(async (row): Promise<ConversationSummary | null> => {
      const peer = await getPublicUserSummary(row.peer_id);
      return peer
        ? {
            id: row.id,
            peer,
            dernierMessage: row.dernier_message,
            updatedAt: row.updated_at.toISOString(),
          }
        : null;
    })
  );

  return items.filter((item): item is ConversationSummary => item !== null);
}

/** Détail d'une conversation (interlocuteur). */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<ConversationDetail> {
  const peerId = await assertMember(userId, conversationId);
  const peer = await getPublicUserSummary(peerId);

  if (!peer) {
    throw notFound('Utilisateur introuvable.');
  }

  return { id: conversationId, peer };
}

/** Messages d'une conversation (du plus ancien au plus récent). */
export async function listMessages(
  userId: string,
  conversationId: string
): Promise<PublicMessage[]> {
  await assertMember(userId, conversationId);

  const result = await pool.query<MessageRow>(
    `SELECT id, auteur_id, contenu, created_at
       FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at
      LIMIT $2`,
    [conversationId, MESSAGES_PAGE_SIZE]
  );

  return result.rows.map((row) => ({
    id: row.id,
    auteurId: row.auteur_id,
    contenu: row.contenu,
    estMoi: row.auteur_id === userId,
    createdAt: row.created_at.toISOString(),
  }));
}

/** Envoie un message dans une conversation. */
export async function sendMessage(
  userId: string,
  conversationId: string,
  contenu: string
): Promise<PublicMessage> {
  await assertMember(userId, conversationId);

  const inserted = await pool.query<MessageRow>(
    `INSERT INTO messages (conversation_id, auteur_id, contenu)
     VALUES ($1, $2, $3)
     RETURNING id, auteur_id, contenu, created_at`,
    [conversationId, userId, contenu]
  );

  const row = inserted.rows[0];

  if (!row) {
    throw new Error("L'envoi du message a échoué.");
  }

  await pool.query('UPDATE conversations SET updated_at = now() WHERE id = $1', [conversationId]);

  return {
    id: row.id,
    auteurId: row.auteur_id,
    contenu: row.contenu,
    estMoi: true,
    createdAt: row.created_at.toISOString(),
  };
}
