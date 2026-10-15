import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';

/**
 * Restreint l'accès à une ou plusieurs valeurs de rôle.
 * À utiliser après le middleware `authenticate`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new HttpError(401, 'Authentification requise.'));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new HttpError(403, "Vous n'avez pas les droits nécessaires pour cette action."));
      return;
    }

    next();
  };
}
