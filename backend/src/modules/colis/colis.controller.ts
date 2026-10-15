import type { Request, Response } from 'express';
import type { TokenPayload } from '../../utils/jwt.js';
import { unauthorized, validationError } from '../../utils/http-error.js';
import {
  validateAdvanceEtape,
  validateCreateEvaluation,
} from '../../utils/validation.js';
import {
  advanceEtape,
  confirmDelivery,
  createEvaluation,
  getColisDetail,
  getRemuneration,
  listColis,
} from './colis.service.js';

/** Récupère le contenu du jeton (garanti par le middleware `authenticate`). */
function requireAuth(req: Request): TokenPayload {
  if (!req.auth) {
    throw unauthorized();
  }
  return req.auth;
}

/** GET /api/colis/me — colis de l'utilisateur connecté (expéditeur), paginés. */
export async function listMyColisController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const limit = Math.min(Math.max(Number(req.query['limit']) || 20, 1), 50);
  const offset = Math.max(Number(req.query['offset']) || 0, 0);

  const page = await listColis(auth.sub, limit, offset);
  res.json(page);
}

/** GET /api/colis/:id — détail et suivi d'un colis. */
export async function getColisController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const colis = await getColisDetail(auth.sub, String(req.params['id']));
  res.json(colis);
}

/** POST /api/colis/:id/etapes — enregistre l'étape suivante (voyageur). */
export async function advanceEtapeController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateAdvanceEtape(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const colis = await advanceEtape(auth.sub, String(req.params['id']), data);
  res.json(colis);
}

/** POST /api/colis/:id/livraison — confirme la remise au destinataire (expéditeur). */
export async function confirmDeliveryController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const colis = await confirmDelivery(auth.sub, String(req.params['id']));
  res.json(colis);
}

/** GET /api/colis/:id/remuneration — rémunération libérée (voyageur uniquement). */
export async function getRemunerationController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const remuneration = await getRemuneration(auth.sub, String(req.params['id']));
  res.json(remuneration);
}

/** POST /api/colis/:id/evaluation — évaluation du voyageur (expéditeur). */
export async function createEvaluationController(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);

  const { data, errors } = validateCreateEvaluation(req.body);

  if (Object.keys(errors).length > 0) {
    throw validationError(errors);
  }

  const evaluation = await createEvaluation(auth.sub, String(req.params['id']), data);
  res.status(201).json(evaluation);
}
