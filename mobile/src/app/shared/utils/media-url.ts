import { environment } from '../../../environments/environment';

/**
 * Construit l'URL d'un média servi par l'API (photo de profil).
 * Les fichiers sont exposés sous le préfixe de l'API (`/api/uploads/…`) :
 * - en développement, `environment.apiUrl` est relatif (`/api`) et l'URL passe
 *   par le proxy du serveur de dev ;
 * - en production, l'origine de l'API est utilisée.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${environment.apiUrl}${path}`;
}
