import { TempsRelatifPipe } from './relative-time.pipe';

describe('TempsRelatifPipe', () => {
  const pipe = new TempsRelatifPipe();
  const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  it('formate une date récente en français', () => {
    expect(pipe.transform(daysAgo(1))).toBe('il y a 1 jour');
    expect(pipe.transform(daysAgo(2))).toBe('il y a 2 jours');
  });

  it('formate les semaines', () => {
    expect(pipe.transform(daysAgo(14))).toBe('il y a 2 semaines');
  });

  it('formate les mois', () => {
    expect(pipe.transform(daysAgo(40))).toBe('il y a 1 mois');
  });

  it('renvoie une chaîne vide pour une valeur absente ou invalide', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('date-invalide')).toBe('');
  });
});
