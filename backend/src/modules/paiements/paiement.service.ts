import { pool } from '../../config/database.js';
import { getPublicUserSummary, type PublicUserSummary } from '../users/user.service.js';

/** Paiement exposé par l'API (jamais de données sensibles). */
export interface PublicPaiement {
  id: string;
  montant: number;
  devise: string;
  statut: string;
  methode: string | null;
  /** « recu » si l'utilisateur est le bénéficiaire, « envoye » s'il est le payeur. */
  sens: 'recu' | 'envoye';
  contrepartie: PublicUserSummary | null;
  colisId: string | null;
  colisReference: string | null;
  createdAt: string;
}

export interface PaiementPage {
  items: PublicPaiement[];
  total: number;
  limit: number;
  offset: number;
}

interface PaiementRow {
  id: string;
  montant: string;
  devise: string;
  statut: string;
  methode: string | null;
  payeur_id: string;
  beneficiaire_id: string | null;
  colis_id: string | null;
  colis_reference: string | null;
  created_at: Date;
}

/** Historique des paiements de l'utilisateur (reçus et envoyés). */
export async function listPaiements(
  userId: string,
  limit: number,
  offset: number
): Promise<PaiementPage> {
  const [rows, count] = await Promise.all([
    pool.query<PaiementRow>(
      `SELECT p.id, p.montant, p.devise, p.statut, p.methode, p.created_at,
              p.payeur_id, p.beneficiaire_id,
              c.id AS colis_id, c.reference AS colis_reference
         FROM paiements p
         JOIN demandes d ON d.id = p.demande_id
         JOIN colis c ON c.id = d.colis_id
        WHERE p.payeur_id = $1 OR p.beneficiaire_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query<{ total: string }>(
      `SELECT count(*) AS total FROM paiements
        WHERE payeur_id = $1 OR beneficiaire_id = $1`,
      [userId]
    ),
  ]);

  const items = await Promise.all(
    rows.rows.map(async (row): Promise<PublicPaiement> => {
      const recu = row.beneficiaire_id === userId;
      const peerId = recu ? row.payeur_id : row.beneficiaire_id;

      return {
        id: row.id,
        montant: Number(row.montant),
        devise: row.devise,
        statut: row.statut,
        methode: row.methode,
        sens: recu ? 'recu' : 'envoye',
        contrepartie: peerId ? await getPublicUserSummary(peerId) : null,
        colisId: row.colis_id,
        colisReference: row.colis_reference,
        createdAt: row.created_at.toISOString(),
      };
    })
  );

  return {
    items,
    total: Number(count.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}
