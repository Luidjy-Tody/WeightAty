/** Corps d'erreur renvoyé par l'API Weight'Aty. */
export interface ApiErrorBody {
  message?: string;
  details?: Record<string, string>;
}

/** Message lisible à afficher pour une erreur d'appel API. */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  const body = (error as { error?: ApiErrorBody } | null)?.error;

  if (body && typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  return fallback;
}

/** Erreurs de validation par champ renvoyées par l'API (HTTP 422). */
export function apiFieldErrors(error: unknown): Record<string, string> {
  const body = (error as { error?: ApiErrorBody } | null)?.error;
  return body && typeof body.details === 'object' && body.details !== null ? body.details : {};
}

/** Message affiché lorsque l'API n'a pas répondu (arrêtée, réseau coupé, passerelle). */
export const API_UNREACHABLE_MESSAGE =
  "Impossible de joindre l'API. Vérifiez qu'elle est bien démarrée (npm run dev dans backend/).";

/**
 * Indique que l'erreur vient d'une API injoignable et non d'un refus métier :
 * - statut `0` : le navigateur n'a pas pu établir la connexion ;
 * - statut `502`/`503`/`504` ou `5xx` sans message applicatif : le proxy de
 *   développement n'a pas réussi à joindre le backend (arrêté).
 */
export function isApiUnreachable(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;

  if (typeof status !== 'number') {
    return false;
  }

  if (status !== 0 && status < 500) {
    return false;
  }

  const body = (error as { error?: unknown } | null)?.error;
  const hasApiMessage = typeof (body as { message?: unknown } | null)?.message === 'string';

  return status === 0 || !hasApiMessage;
}
