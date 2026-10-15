import type { UserRole } from '../models/user.model';

/**
 * Écran d'accueil par défaut selon le rôle de l'utilisateur connecté.
 * Les administrateurs arrivent sur l'espace d'administration, les autres
 * membres sur leur profil.
 */
export function homeRouteForRole(role: UserRole): string {
  return role === 'administrateur' ? '/administration' : '/profil';
}
