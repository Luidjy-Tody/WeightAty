/** Résultat de l'estimation de robustesse d'un mot de passe. */
export interface PasswordStrength {
  /** 0 = vide, 1 = faible, 2 = moyen, 3 = bon. */
  score: 0 | 1 | 2 | 3;
  /** Libellé français affiché sous le champ. */
  label: string;
}

/**
 * Estime la robustesse d'un mot de passe (longueur, variété des caractères).
 * Purement indicatif : la règle bloquante reste celle de l'inscription
 * (8 caractères minimum).
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) {
    return { score: 0, label: '' };
  }

  let points = 0;

  if (value.length >= 8) {
    points += 1;
  }
  if (value.length >= 12) {
    points += 1;
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    points += 1;
  }
  if (/\d/.test(value)) {
    points += 1;
  }
  if (/[^A-Za-z0-9]/.test(value)) {
    points += 1;
  }

  if (points <= 2) {
    return { score: 1, label: 'Force : faible' };
  }
  if (points <= 4) {
    return { score: 2, label: 'Force : moyenne' };
  }

  return { score: 3, label: 'Force : bonne' };
}
