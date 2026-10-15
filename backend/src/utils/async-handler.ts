import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Enveloppe un handler asynchrone afin que toute promesse rejetée soit
 * transmise au middleware de gestion des erreurs d'Express.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
