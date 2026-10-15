import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized } from '../../utils/http-error.js';
import { listPaiements } from './paiement.service.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/** GET /api/paiements/me — historique des paiements de l'utilisateur connecté. */
export async function listMyPaiementsController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const limit = Math.min(Math.max(Number(req.query['limit']) || 20, 1), 50);
  const offset = Math.max(Number(req.query['offset']) || 0, 0);

  const page = await listPaiements(auth.sub, limit, offset);
  res.json(page);
}
