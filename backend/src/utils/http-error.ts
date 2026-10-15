/**
 * Erreur applicative transportant un code HTTP, un message (en français) et,
 * le cas échéant, des erreurs de validation par champ.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Erreur 400 : requête invalide. */
export function badRequest(message: string, details?: Record<string, string>): HttpError {
  return new HttpError(400, message, details);
}

/** Erreur 401 : authentification requise ou invalide. */
export function unauthorized(message = 'Authentification requise.'): HttpError {
  return new HttpError(401, message);
}

/** Erreur 403 : action interdite (droits insuffisants, compte désactivé…). */
export function forbidden(message = 'Accès refusé.'): HttpError {
  return new HttpError(403, message);
}

/** Erreur 404 : ressource introuvable. */
export function notFound(message = 'Ressource introuvable.'): HttpError {
  return new HttpError(404, message);
}

/** Erreur 429 : trop de requêtes (protection anti force brute). */
export function tooManyRequests(message: string): HttpError {
  return new HttpError(429, message);
}

/** Erreur 409 : conflit (unicité). */
export function conflict(message: string, details?: Record<string, string>): HttpError {
  return new HttpError(409, message, details);
}

/** Erreur 422 : données invalides. */
export function validationError(details: Record<string, string>): HttpError {
  return new HttpError(422, 'Certaines informations sont invalides.', details);
}
