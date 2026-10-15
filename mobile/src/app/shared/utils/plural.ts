/**
 * Choisit la forme singulière ou plurielle d'un libellé selon le nombre.
 * En français, le pluriel s'emploie à partir de 2 (0 et 1 restent au singulier).
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count > 1 ? plural : singular;
}

/** Construit un libellé « N singulier/pluriel » (ex. « 2 trajets publiés »). */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}
