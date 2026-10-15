import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized, validationError } from '../../utils/http-error.js';
import { validateCreateConversation, validateSendMessage } from '../../utils/validation.js';
import {
  findOrCreateConversation,
  getConversation,
  listConversations,
  listMessages,
  sendMessage,
} from './message.service.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/** GET /api/conversations — conversations de l'utilisateur connecté. */
export async function listConversationsController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const items = await listConversations(auth.sub);
  res.json({ items });
}

/** POST /api/conversations — retrouve ou crée la conversation avec un membre. */
export async function createConversationController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateCreateConversation(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const conversation = await findOrCreateConversation(auth.sub, data.userId);
  res.status(201).json(conversation);
}

/** GET /api/conversations/:id — interlocuteur de la conversation. */
export async function getConversationController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const conversation = await getConversation(auth.sub, String(req.params['id']));
  res.json(conversation);
}

/** GET /api/conversations/:id/messages — messages de la conversation. */
export async function listMessagesController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const items = await listMessages(auth.sub, String(req.params['id']));
  res.json({ items });
}

/** POST /api/conversations/:id/messages — envoie un message. */
export async function sendMessageController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateSendMessage(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const message = await sendMessage(auth.sub, String(req.params['id']), data.contenu);
  res.status(201).json(message);
}
