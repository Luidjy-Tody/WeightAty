import { Injectable } from '@angular/core';

const TOKEN_KEY = 'weightaty.token';

/** Persistance du jeton de session dans le stockage local. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** Jeton courant, ou null si l'utilisateur n'est pas connecté. */
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Enregistre le jeton de session. */
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Stockage indisponible : la session restera en mémoire uniquement.
    }
  }

  /** Supprime le jeton de session. */
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignorer : rien à nettoyer.
    }
  }
}
