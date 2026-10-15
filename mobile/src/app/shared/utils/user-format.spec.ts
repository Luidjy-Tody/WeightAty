import { getFullName, getInitials, normalizePhone } from './user-format';

describe('user-format', () => {
  describe('getInitials', () => {
    it('combine la première lettre du prénom et du nom', () => {
      expect(getInitials('Jean', 'Dupont')).toBe('JD');
    });

    it('met les initiales en majuscules', () => {
      expect(getInitials('marie', 'lambert')).toBe('ML');
    });

    it('gère un nom manquant', () => {
      expect(getInitials('Awa', '')).toBe('A');
    });

    it('renvoie un repli quand aucune donnée n’est disponible', () => {
      expect(getInitials('', '')).toBe('?');
    });
  });

  describe('getFullName', () => {
    it('assemble prénom et nom', () => {
      expect(getFullName('Jean', 'Dupont')).toBe('Jean Dupont');
    });
  });

  describe('normalizePhone', () => {
    it('supprime espaces, points et tirets', () => {
      expect(normalizePhone('+230 5 123 4567')).toBe('+23051234567');
      expect(normalizePhone('+33 6.12.34.56.78')).toBe('+33612345678');
      expect(normalizePhone('06-12-34-56-78')).toBe('0612345678');
    });

    it('conserve uniquement le « + » initial', () => {
      expect(normalizePhone('(230) 5123 4567')).toBe('23051234567');
      expect(normalizePhone('+230 (5) 123 4567')).toBe('+23051234567');
    });
  });
});
