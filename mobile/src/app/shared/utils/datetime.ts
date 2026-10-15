/**
 * Formatage des dates et heures en français, dans le fuseau Indian/Mauritius
 * (les horodatages sont stockés en UTC côté serveur).
 */

/** Fuseau d'affichage de l'application. */
export const DISPLAY_TIME_ZONE = 'Indian/Mauritius';

const fullDate = new Intl.DateTimeFormat('fr-FR', {
  timeZone: DISPLAY_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  timeZone: DISPLAY_TIME_ZONE,
  day: 'numeric',
  month: 'short',
});

const timeOnly = new Intl.DateTimeFormat('fr-FR', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Clé de jour (AAAA-MM-JJ) dans le fuseau d'affichage. */
function dayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date complète : « 12 novembre 2026 ». */
export function formatDateFull(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? fullDate.format(date) : '';
}

/** Date abrégée : « 10 nov. ». */
export function formatDateShort(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? shortDate.format(date).replace('.', '') : '';
}

/** Heure : « 09:14 ». */
export function formatTime(value: string | null | undefined): string {
  const date = toDate(value);
  return date ? timeOnly.format(date) : '';
}

/** Indique si l'horodatage correspond au jour courant (fuseau d'affichage). */
export function isToday(value: string | null | undefined): boolean {
  const date = toDate(value);
  return date ? dayKey(date) === dayKey(new Date()) : false;
}

/** Libellé court : « Aujourd'hui » ou « 10 nov. ». */
export function formatDayLabel(value: string | null | undefined): string {
  return isToday(value) ? "Aujourd'hui" : formatDateShort(value);
}

/** « 10 nov. • 09:14 » (ou « Aujourd'hui • 08:10 »). */
export function formatStamp(value: string | null | undefined): string {
  const day = formatDayLabel(value);
  const time = formatTime(value);

  if (!day && !time) {
    return '';
  }

  return time ? `${day} • ${time}` : day;
}

/** « Arrivée prévue le 12 novembre 2026 ». */
export function formatArrivalLabel(value: string | null | undefined): string {
  const full = formatDateFull(value);
  return full ? `Arrivée prévue le ${full}` : '';
}

/** « Prévu le 12 nov. » ou « À venir ». */
export function formatExpectedLabel(value: string | null | undefined): string {
  const short = formatDateShort(value);
  return short ? `Prévu le ${short}` : 'À venir';
}
