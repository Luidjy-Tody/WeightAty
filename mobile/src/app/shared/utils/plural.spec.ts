import { countLabel, pluralize } from './plural';

describe('pluralize', () => {
  it('reste au singulier pour 0 et 1', () => {
    expect(pluralize(0, 'trajet publié', 'trajets publiés')).toBe('trajet publié');
    expect(pluralize(1, 'trajet publié', 'trajets publiés')).toBe('trajet publié');
  });

  it('passe au pluriel à partir de 2', () => {
    expect(pluralize(2, 'trajet publié', 'trajets publiés')).toBe('trajets publiés');
  });
});

describe('countLabel', () => {
  it('préfixe le libellé par le nombre', () => {
    expect(countLabel(1, 'trajet publié', 'trajets publiés')).toBe('1 trajet publié');
    expect(countLabel(3, 'trajet publié', 'trajets publiés')).toBe('3 trajets publiés');
  });

  it('gère un pluriel identique au singulier (avis)', () => {
    expect(countLabel(2, 'avis', 'avis')).toBe('2 avis');
  });
});
