import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/http-error.js';
import { isSessionRejected } from '../modules/auth/auth.service.js';

/**
 * Exige un jeton JWT valide dans l'en-tête `Authorization: Bearer <token>`.
 * L'identité de l'utilisateur est déduite du jeton uniquement ; les jetons
 * révoqués (déconnexion) ou invalidés (changement de mot de passe, suppression
 * de compte) sont rejetés.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyToken(token);

    if (await isSessionRejected(payload.jti, payload.sub, payload.iat)) {
      next(unauthorized('Session expirée, veuillez vous reconnecter.'));
      return;
    }

    req.auth = payload;
    next();
  } catch (error) {
    next(error);
  }
}
