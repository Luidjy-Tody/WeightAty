import { formatDateFr, normalizeFlightNumber, toNumber, todayIso } from './trajet-format';

describe('trajet-format', () => {
  describe('formatDateFr', () => {
    it('convertit une date ISO au format français', () => {
      expect(formatDateFr('2026-11-12')).toBe('12/11/2026');
    });

    it('renvoie une chaîne vide pour une valeur absente', () => {
      expect(formatDateFr(null)).toBe('');
      expect(formatDateFr(undefined)).toBe('');
    });
  });

  describe('normalizeFlightNumber', () => {
    it('met en majuscules et sépare le code compagnie du numéro', () => {
      expect(normalizeFlightNumber('mk014')).toBe('MK 014');
      expect(normalizeFlightNumber('MK 014')).toBe('MK 014');
      expect(normalizeFlightNumber('  af1234 ')).toBe('AF 1234');
      expect(normalizeFlightNumber('BA9')).toBe('BA 9');
    });

    it('laisse une valeur non reconnue en majuscules sans espaces', () => {
      expect(normalizeFlightNumber('abc')).toBe('ABC');
    });
  });

  describe('toNumber', () => {
    it('accepte la virgule décimale française', () => {
      expect(toNumber('20,5')).toBe(20.5);
      expect(toNumber('20.5')).toBe(20.5);
      expect(toNumber(20)).toBe(20);
    });

    it('renvoie null pour une saisie vide ou invalide', () => {
      expect(toNumber('')).toBeNull();
      expect(toNumber('abc')).toBeNull();
      expect(toNumber(null)).toBeNull();
    });
  });

  describe('todayIso', () => {
    it('renvoie une date au format AAAA-MM-JJ', () => {
      expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
