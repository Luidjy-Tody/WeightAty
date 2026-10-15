/** Séparation d'un libellé « Ville (CODE) » en ville et code aéroport. */
export function splitCityCode(label: string | null | undefined): {
  city: string;
  code: string | null;
} {
  if (!label) {
    return { city: '', code: null };
  }

  const match = /^(.*?)\s*\(([A-Z]{3})\)\s*$/.exec(label);

  if (!match) {
    return { city: label, code: null };
  }

  return { city: (match[1] ?? '').trim(), code: match[2] ?? null };
}
