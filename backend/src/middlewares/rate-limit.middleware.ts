import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { tooManyRequests } from '../utils/http-error.js';

/**
 * Protection anti force brute, sans dépendance externe.
 *
 * Compte les échecs par couple « adresse IP + cible » et bloque temporairement
 * la source au-delà d'un seuil. La mémoire étant locale au processus, un
 * déploiement multi-instances devra utiliser un stockage partagé (Redis).
 */

/** Fenêtre glissante d'observation des échecs. */
const WINDOW_MS = 15 * 60 * 1000;
/** Nombre d'échecs autorisés avant blocage. */
const MAX_FAILURES = 5;
/** Durée du blocage une fois le seuil atteint. */
const BLOCK_MS = 15 * 60 * 1000;

interface AttemptRecord {
  failures: number;
  lastFailureAt: number;
  blockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();

/** Clé de suivi de la connexion : IP + e-mail visé. */
function loginKey(req: Request): string {
  const body = req.body as { email?: unknown } | undefined;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  return `connexion|${req.ip ?? 'inconnu'}|${email}`;
}

/** Clé de suivi des actions sensibles : IP + utilisateur connecté. */
function sensitiveKey(req: Request): string {
  return `sensible|${req.ip ?? 'inconnu'}|${req.auth?.sub ?? ''}`;
}

function registerFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.lastFailureAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, lastFailureAt: now, blockedUntil: 0 });
    return;
  }

  record.failures += 1;
  record.lastFailureAt = now;

  if (record.failures >= MAX_FAILURES) {
    record.blockedUntil = now + BLOCK_MS;
    record.failures = 0;
  }
}

/** Purge les entrées expirées pour éviter une croissance illimitée. */
function cleanup(now: number): void {
  if (attempts.size < 500) {
    return;
  }

  for (const [key, record] of attempts) {
    if (now - record.lastFailureAt > WINDOW_MS && record.blockedUntil < now) {
      attempts.delete(key);
    }
  }
}

/** Refuse la requête si la source est bloquée. */
function isBlocked(key: string, res: Response, next: NextFunction): boolean {
  const now = Date.now();
  cleanup(now);

  const record = attempts.get(key);

  if (!record || record.blockedUntil <= now) {
    return false;
  }

  const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
  const minutes = Math.ceil(retryAfterSeconds / 60);

  res.setHeader('Retry-After', String(retryAfterSeconds));
  next(
    tooManyRequests(
      `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
    )
  );
  return true;
}

/**
 * Middleware des routes de connexion : refuse la requête si la source est
 * bloquée, et comptabilise les échecs d'authentification (401/403).
 */
export const loginRateLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const key = loginKey(req);

  if (isBlocked(key, res, next)) {
    return;
  }

  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      registerFailure(key);
    } else if (res.statusCode < 400) {
      attempts.delete(key);
    }
  });

  next();
};

/**
 * Middleware des actions sensibles (changement de mot de passe, suppression de
 * compte) : comptabilise toute tentative infructueuse (4xx), notamment un mot
 * de passe actuel erroné.
 */
export const sensitiveActionRateLimiter: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = sensitiveKey(req);

  if (isBlocked(key, res, next)) {
    return;
  }

  res.on('finish', () => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      registerFailure(key);
    } else if (res.statusCode < 400) {
      attempts.delete(key);
    }
  });

  next();
};
