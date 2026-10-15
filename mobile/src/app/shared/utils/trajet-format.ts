/** Formatage et normalisation liés aux trajets. */

/** Convertit une date AAAA-MM-JJ au format français JJ/MM/AAAA. */
export function formatDateFr(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);

  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Normalise un numéro de vol : majuscules, sans espaces superflus, avec un
 * espace unique entre le code compagnie et le numéro (« mk014 » → « MK 014 »).
 * Même règle que côté serveur.
 */
export function normalizeFlightNumber(value: string): string {
  const compact = value.trim().toUpperCase().replace(/\s+/g, '');
  const match = /^([A-Z]{2,3}?)(\d{1,4})$/.exec(compact);
  return match ? `${match[1]} ${match[2]}` : compact;
}

/** Convertit une saisie numérique (virgule acceptée) en nombre, ou null. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    if (normalized === '') {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/** Date du jour (fuseau local) au format AAAA-MM-JJ. */
export function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
