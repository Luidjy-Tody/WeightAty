import { FormControl, FormGroup } from '@angular/forms';
import {
  arrivalAfterDepartureValidator,
  flightNumberValidator,
  isoDateValidator,
  locationsDifferValidator,
  notPastDateValidator,
  positiveNumberValidator,
} from './trajet.validators';
import { todayIso } from '../utils/trajet-format';

describe('validateurs de trajet', () => {
  describe('positiveNumberValidator', () => {
    const validate = positiveNumberValidator({ max: 50, maxDecimals: 2 });

    it('accepte un nombre positif dans les bornes', () => {
      expect(validate(new FormControl('20'))).toBeNull();
      expect(validate(new FormControl('0,5'))).toBeNull();
    });

    it('refuse un champ vide', () => {
      expect(validate(new FormControl(''))).toEqual({ required: true });
    });

    it('refuse zéro et les valeurs négatives', () => {
      expect(validate(new FormControl('0'))).toEqual({ numberPositive: true });
      expect(validate(new FormControl('-3'))).toEqual({ numberPositive: true });
    });

    it('refuse une valeur au-dessus du maximum', () => {
      expect(validate(new FormControl('51'))).toEqual({ numberMax: { max: 50 } });
    });

    it('refuse plus de deux décimales', () => {
      expect(validate(new FormControl('12.345'))).toEqual({ numberDecimals: { max: 2 } });
    });

    it('refuse une saisie non numérique', () => {
      expect(validate(new FormControl('abc'))).toEqual({ numberFormat: true });
    });
  });

  describe('isoDateValidator', () => {
    it('accepte une date valide', () => {
      expect(isoDateValidator(new FormControl('2026-11-12'))).toBeNull();
    });

    it('refuse un champ vide', () => {
      expect(isoDateValidator(new FormControl(''))).toEqual({ required: true });
    });

    it('refuse une date inexistante', () => {
      expect(isoDateValidator(new FormControl('2026-02-31'))).toEqual({ dateFormat: true });
    });
  });

  describe('notPastDateValidator', () => {
    it('refuse une date passée', () => {
      expect(notPastDateValidator(new FormControl('2020-01-01'))).toEqual({ datePast: true });
    });

    it("accepte la date du jour", () => {
      expect(notPastDateValidator(new FormControl(todayIso()))).toBeNull();
    });
  });

  describe('flightNumberValidator', () => {
    it('accepte un numéro de vol normalisable', () => {
      expect(flightNumberValidator(new FormControl('mk014'))).toBeNull();
      expect(flightNumberValidator(new FormControl('MK 014'))).toBeNull();
    });

    it('refuse un format invalide', () => {
      expect(flightNumberValidator(new FormControl('ABC'))).toEqual({ flightNumber: true });
      expect(flightNumberValidator(new FormControl('1234'))).toEqual({ flightNumber: true });
    });

    it('refuse un champ vide', () => {
      expect(flightNumberValidator(new FormControl(''))).toEqual({ required: true });
    });
  });

  describe('locationsDifferValidator', () => {
    const group = (depart: string, arrivee: string) =>
      new FormGroup({
        departIata: new FormControl(depart, { nonNullable: true }),
        arriveeIata: new FormControl(arrivee, { nonNullable: true }),
      });

    it('accepte deux aéroports différents', () => {
      expect(locationsDifferValidator(group('MRU', 'CDG'))).toBeNull();
    });

    it('refuse un départ identique à la destination', () => {
      expect(locationsDifferValidator(group('CDG', 'CDG'))).toEqual({ sameLocation: true });
    });
  });

  describe('arrivalAfterDepartureValidator', () => {
    const group = (depart: string, arrivee: string) =>
      new FormGroup({
        dateDepart: new FormControl(depart, { nonNullable: true }),
        dateArrivee: new FormControl(arrivee, { nonNullable: true }),
      });

    it('accepte une arrivée le jour du départ', () => {
      expect(arrivalAfterDepartureValidator(group('2026-11-12', '2026-11-12'))).toBeNull();
    });

    it('refuse une arrivée antérieure au départ', () => {
      expect(arrivalAfterDepartureValidator(group('2026-11-12', '2026-11-10'))).toEqual({
        arrivalBeforeDeparture: true,
      });
    });
  });
});
