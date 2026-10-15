import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized, validationError } from '../../utils/http-error.js';
import { validateCreateTrajet } from '../../utils/validation.js';
import {
  assertCanPublishTrajet,
  createTrajet,
  getTrajetDetail,
  listTrajetsByVoyageur,
} from './trajet.service.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/**
 * POST /api/trajets — publication d'un trajet par l'utilisateur connecté.
 * L'identité provient du jeton : aucun `voyageurId` n'est accepté du client.
 */
export async function createTrajetController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateCreateTrajet(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  await assertCanPublishTrajet(auth.sub);

  const trajet = await createTrajet(auth.sub, data);
  res.status(201).json(trajet);
}

/** GET /api/trajets/me — trajets publiés par l'utilisateur connecté. */
export async function listMyTrajetsController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const items = await listTrajetsByVoyageur(auth.sub);
  res.json({ items, total: items.length });
}

/** GET /api/trajets/:id — détail d'un trajet (voyageur + droits de l'appelant). */
export async function getTrajetController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const trajet = await getTrajetDetail(auth.sub, String(req.params['id']));
  res.json(trajet);
}
