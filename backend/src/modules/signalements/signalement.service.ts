import { pool } from '../../config/database.js';
import { forbidden, notFound } from '../../utils/http-error.js';
import type { CreateSignalementInput } from '../../utils/validation.js';

export interface CreatedSignalement {
  id: string;
  createdAt: string;
}

interface ColisAccessRow {
  expediteur_id: string;
  voyageur_id: string | null;
}

/**
 * Enregistre un signalement après vérification que l'utilisateur a bien accès
 * à la ressource signalée.
 */
export async function createSignalement(
  userId: string,
  input: CreateSignalementInput
): Promise<CreatedSignalement> {
  if (input.cibleType === 'trajet') {
    const trajet = await pool.query('SELECT 1 FROM trajets WHERE id = $1', [input.cibleId]);

    if (trajet.rowCount === 0) {
      throw notFound('Trajet introuvable.');
    }
  } else {
    const colis = await pool.query<ColisAccessRow>(
      `SELECT c.expediteur_id,
              (SELECT dd.voyageur_id FROM demandes dd
                WHERE dd.colis_id = c.id ORDER BY dd.created_at DESC LIMIT 1) AS voyageur_id
         FROM colis c WHERE c.id = $1`,
      [input.cibleId]
    );

    const row = colis.rows[0];

    if (!row) {
      throw notFound('Colis introuvable.');
    }

    if (row.expediteur_id !== userId && row.voyageur_id !== userId) {
      throw forbidden("Vous n'avez pas accès à ce colis.");
    }
  }

  const inserted = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO signalements (auteur_id, cible_type, cible_id, motif, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [userId, input.cibleType, input.cibleId, input.motif, input.message]
  );

  const row = inserted.rows[0];

  if (!row) {
    throw new Error("L'enregistrement du signalement a échoué.");
  }

  return { id: row.id, createdAt: row.created_at.toISOString() };
}
