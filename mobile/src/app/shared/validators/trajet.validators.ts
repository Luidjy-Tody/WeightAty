import { AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { normalizeFlightNumber, todayIso, toNumber } from '../utils/trajet-format';

/**
 * Validateurs du formulaire de trajet. Ils renvoient des clés d'erreur
 * techniques ; les messages français sont composés par le formulaire
 * (voir `trip-form.component.ts`).
 */

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/** Numéro de vol normalisé : code compagnie (2-3 lettres) + espace + numéro. */
const FLIGHT_NUMBER_REGEX = /^[A-Z]{2,3} \d{1,4}$/;

/** Vérifie qu'une chaîne est une date calendaire AAAA-MM-JJ. */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Champ numérique obligatoire, strictement positif, borné et limité en décimales.
 * Erreurs possibles : `required`, `numberFormat`, `numberPositive`, `numberMax`,
 * `numberDecimals`.
 */
export function positiveNumberValidator(options: {
  max: number;
  maxDecimals: number;
}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = String(control.value ?? '').trim();

    if (raw === '') {
      return { required: true };
    }

    const value = toNumber(raw);

    if (value === null) {
      return { numberFormat: true };
    }
    if (value <= 0) {
      return { numberPositive: true };
    }
    if (value > options.max) {
      return { numberMax: { max: options.max } };
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-9) {
      return { numberDecimals: { max: options.maxDecimals } };
    }

    return null;
  };
}

/** Date obligatoire, au format AAAA-MM-JJ. Erreurs : `required`, `dateFormat`. */
export const isoDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (value === '') {
    return { required: true };
  }

  return isValidIsoDate(value) ? null : { dateFormat: true };
};

/** Date qui ne peut pas être antérieure à aujourd'hui. Erreur : `datePast`. */
export const notPastDateValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!isValidIsoDate(value)) {
    return null;
  }

  return value < todayIso() ? { datePast: true } : null;
};

/** Numéro de vol au bon format. Erreurs : `required`, `flightNumber`. */
export const flightNumberValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const raw = String(control.value ?? '').trim();

  if (raw === '') {
    return { required: true };
  }

  return FLIGHT_NUMBER_REGEX.test(normalizeFlightNumber(raw)) ? null : { flightNumber: true };
};

/** Le départ et la destination doivent être différents. Erreur : `sameLocation`. */
export function locationsDifferValidator(group: AbstractControl): ValidationErrors | null {
  const depart = String(group.get('departIata')?.value ?? '');
  const arrivee = String(group.get('arriveeIata')?.value ?? '');

  return depart !== '' && depart === arrivee ? { sameLocation: true } : null;
}

/** La date d'arrivée doit être postérieure ou égale à la date de départ. */
export function arrivalAfterDepartureValidator(group: AbstractControl): ValidationErrors | null {
  const depart = String(group.get('dateDepart')?.value ?? '');
  const arrivee = String(group.get('dateArrivee')?.value ?? '');

  if (!isValidIsoDate(depart) || !isValidIsoDate(arrivee)) {
    return null;
  }

  return arrivee < depart ? { arrivalBeforeDeparture: true } : null;
}
