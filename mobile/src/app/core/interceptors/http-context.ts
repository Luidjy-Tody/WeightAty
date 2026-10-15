import { HttpContextToken } from '@angular/common/http';

/**
 * Lorsqu'elle vaut `true`, une requête n'entraîne ni déconnexion ni redirection
 * en cas de 401 : utile pour la restauration de session au démarrage, où
 * l'absence de session valide est un cas normal.
 */
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
