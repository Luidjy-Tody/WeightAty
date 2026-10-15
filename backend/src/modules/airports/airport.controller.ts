import type { Request, Response } from 'express';
import { searchAirports } from './airport.service.js';

/** Nombre maximal de résultats renvoyés par la recherche. */
const MAX_RESULTS = 25;

/** GET /api/airports — recherche d'aéroports / villes (autocomplétion). */
export async function searchAirportsController(req: Request, res: Response): Promise<void> {
  const query = typeof req.query['q'] === 'string' ? req.query['q'] : '';
  const requested = Number(req.query['limit']);
  const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 10, 1), MAX_RESULTS);

  const items = await searchAirports(query, limit);
  res.json({ items });
}
