import { CURRENCY_SYMBOL } from '../models/trajet.model';

/** Symboles des devises connues (l'API renvoie le code ISO). */
const CURRENCY_SYMBOLS: Record<string, string> = {
  MUR: CURRENCY_SYMBOL,
  EUR: '€',
  USD: '$',
};

/**
 * Formate un montant avec le symbole de sa devise et le séparateur de milliers
 * de la locale (« Rs 1 250,50 »).
 */
export function formatMoney(amount: number | null | undefined, devise = 'MUR'): string {
  if (amount === null || amount === undefined) {
    return '';
  }

  const symbol = CURRENCY_SYMBOLS[devise] ?? devise;
  const value = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount);

  return `${symbol} ${value}`;
}

/** Formate un poids en kilogrammes : « 20 kg ». */
export function formatWeight(kilograms: number | null | undefined): string {
  if (kilograms === null || kilograms === undefined) {
    return '';
  }

  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(kilograms)} kg`;
}
