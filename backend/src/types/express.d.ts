import type { VerifiedToken } from '../utils/jwt.js';

/**
 * Enrichit la requête Express avec les informations de l'utilisateur
 * authentifié, extraites du jeton (jamais d'un identifiant envoyé par le client).
 */
declare global {
  namespace Express {
    interface Request {
      auth?: VerifiedToken;
    }
  }
}

export {};
