import { pool } from '../../config/database.js';

/** Aéroport / ville de référence. */
export interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
  /** Libellé affiché dans l'application : « Ville (CODE) ». */
  label: string;
}

interface AirportRow {
  iata_code: string;
  city: string;
  country: string;
  name: string;
}

function toAirport(row: AirportRow): Airport {
  return {
    iata: row.iata_code,
    city: row.city,
    country: row.country,
    name: row.name,
    label: `${row.city} (${row.iata_code})`,
  };
}

/**
 * Recherche des aéroports par code IATA, ville, nom ou pays.
 * Une requête vide renvoie les premières entrées (utile à l'ouverture du champ).
 */
export async function searchAirports(query: string, limit: number): Promise<Airport[]> {
  const term = query.trim();

  const result = await pool.query<AirportRow>(
    `SELECT iata_code, city, country, name
       FROM airports
      WHERE $1 = ''
         OR iata_code ILIKE $1 || '%'
         OR city ILIKE '%' || $1 || '%'
         OR name ILIKE '%' || $1 || '%'
         OR country ILIKE '%' || $1 || '%'
      ORDER BY (iata_code ILIKE $1 || '%') DESC, city ASC, iata_code ASC
      LIMIT $2`,
    [term, limit]
  );

  return result.rows.map(toAirport);
}

/** Récupère plusieurs aéroports par leur code IATA. */
export async function findAirportsByIata(codes: string[]): Promise<Map<string, Airport>> {
  if (codes.length === 0) {
    return new Map();
  }

  const result = await pool.query<AirportRow>(
    'SELECT iata_code, city, country, name FROM airports WHERE iata_code = ANY($1::text[])',
    [codes]
  );

  return new Map(result.rows.map((row) => [row.iata_code, toAirport(row)]));
}
