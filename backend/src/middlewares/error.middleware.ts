import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error.js';

/** Réponse renvoyée par l'API en cas d'erreur. */
interface ErrorResponse {
  message: string;
  details?: Record<string, string>;
}

/** Middleware 404 : aucune route ne correspond à la requête. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
}

/**
 * Middleware de gestion des erreurs : centralise le format de réponse et
 * empêche la fuite de détails techniques en production.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof HttpError) {
    const body: ErrorResponse = { message: error.message };

    if (error.details) {
      body.details = error.details;
    }

    res.status(error.status).json(body);
    return;
  }

  // Corps de requête JSON invalide (erreur levée par express.json()).
  if (typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Le corps de la requête est invalide.' });
    return;
  }

  console.error('Erreur inattendue :', error);
  res.status(500).json({ message: 'Une erreur interne est survenue.' });
}
