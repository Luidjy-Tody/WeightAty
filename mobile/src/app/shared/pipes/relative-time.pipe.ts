import { Pipe, type PipeTransform } from '@angular/core';

/** Unités utilisées, du plus fin au plus large. */
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/**
 * Formate une date en temps relatif français (ex. « il y a 2 semaines »,
 * « il y a 1 mois »).
 */
@Pipe({ name: 'tempsRelatif', standalone: true })
export class TempsRelatifPipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'always' });

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    let duration = (date.getTime() - Date.now()) / 1000;

    for (const division of DIVISIONS) {
      if (Math.abs(duration) < division.amount) {
        return this.formatter.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }

    return '';
  }
}
