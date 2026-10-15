import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized, validationError } from '../../utils/http-error.js';
import { validateCreateSignalement } from '../../utils/validation.js';
import { createSignalement } from './signalement.service.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/** POST /api/signalements — signale un trajet ou un colis. */
export async function createSignalementController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateCreateSignalement(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const signalement = await createSignalement(auth.sub, data);
  res.status(201).json(signalement);
}
