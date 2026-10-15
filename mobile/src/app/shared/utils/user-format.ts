/**
 * Calcule les initiales affichées dans l'avatar à partir du prénom et du nom.
 * Exemple : « Jean Dupont » → « JD ».
 */
export function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();

  const letters = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  if (letters.length > 0) {
    return letters;
  }

  // Repli sur la première lettre du seul nom disponible.
  return (first || last || '?').charAt(0).toUpperCase();
}

/** Nom complet affiché (prénom + nom). */
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Normalise un numéro de téléphone pour la validation : supprime espaces,
 * points, tirets et parenthèses, conserve un « + » initial
 * (ex. « +230 5 123 4567 » → « +23051234567 »). Même règle que le serveur.
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}
