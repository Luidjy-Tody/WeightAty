import { pool } from '../../config/database.js';
import type { Pool, PoolClient } from 'pg';
import { conflict, forbidden, notFound } from '../../utils/http-error.js';
import type { AdvanceEtapeInput, CreateEvaluationInput } from '../../utils/validation.js';
import {
  getPublicUserSummary,
  getWallet,
  type PublicUserSummary,
} from '../users/user.service.js';

export type ColisStatut = 'en_attente' | 'en_transit' | 'livre' | 'annule';

export type EtapeColis =
  | 'demande_envoyee'
  | 'demande_acceptee'
  | 'remis_voyageur'
  | 'en_transit'
  | 'arrive_destination'
  | 'remis_destinataire';

/** Ordre officiel des étapes de suivi. */
export const ETAPES: EtapeColis[] = [
  'demande_envoyee',
  'demande_acceptee',
  'remis_voyageur',
  'en_transit',
  'arrive_destination',
  'remis_destinataire',
];

/** Libellés français des étapes (utilisés dans les messages d'erreur). */
const ETAPE_LABELS: Record<EtapeColis, string> = {
  demande_envoyee: 'Demande envoyée',
  demande_acceptee: 'Demande acceptée',
  remis_voyageur: 'Colis remis au voyageur',
  en_transit: 'En transit',
  arrive_destination: 'Arrivé à destination',
  remis_destinataire: 'Colis remis au destinataire',
};

export interface PublicEtape {
  etape: EtapeColis;
  occurredAt: string;
  auteurId: string | null;
}

export interface PublicEvaluation {
  id: string;
  note: number;
  commentaire: string | null;
  tags: string[];
  createdAt: string;
}

export interface ColisListeItem {
  id: string;
  reference: string;
  description: string;
  statut: ColisStatut;
  villeOrigine: string | null;
  villeDestination: string | null;
  poidsKg: number;
  devise: string;
  montant: number | null;
  createdAt: string;
}

export interface ColisDetail extends ColisListeItem {
  role: 'expediteur' | 'voyageur';
  expediteur: PublicUserSummary;
  voyageur: PublicUserSummary | null;
  trajetId: string | null;
  dateArriveePrevue: string | null;
  etapes: PublicEtape[];
  /** Prochaine étape à enregistrer (null si le suivi est terminé). */
  prochaineEtape: EtapeColis | null;
  peutConfirmerLivraison: boolean;
  peutEvaluer: boolean;
  evaluation: PublicEvaluation | null;
  montantLibere: number | null;
}

export interface ColisPage {
  items: ColisListeItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface Remuneration {
  montant: number;
  devise: string;
  solde: number;
  deviseSolde: string;
  statut: ColisStatut;
}

interface ColisRow {
  id: string;
  reference: string;
  description: string;
  statut: ColisStatut;
  poids_kg: string;
  devise: string;
  ville_origine: string | null;
  ville_destination: string | null;
  created_at: Date;
  expediteur_id: string;
  demande_id: string | null;
  demande_prix: string | null;
  demande_devise: string | null;
  voyageur_id: string | null;
  trajet_id: string | null;
  trajet_ville_depart: string | null;
  trajet_ville_arrivee: string | null;
  date_arrivee: string | null;
}

/**
 * Sélection d'un colis avec sa dernière demande et le trajet associé.
 * L'itinéraire affiché privilégie celui du trajet, complété par celui du colis.
 */
const COLIS_SELECT = `
  SELECT c.id,
         c.reference,
         c.description,
         c.statut,
         c.poids_kg,
         c.devise,
         c.ville_origine,
         c.ville_destination,
         c.created_at,
         c.expediteur_id,
         d.id             AS demande_id,
         d.prix           AS demande_prix,
         d.devise         AS demande_devise,
         d.voyageur_id    AS voyageur_id,
         t.id             AS trajet_id,
         t.ville_depart   AS trajet_ville_depart,
         t.ville_arrivee  AS trajet_ville_arrivee,
         to_char(t.date_arrivee, 'YYYY-MM-DD') AS date_arrivee
    FROM colis c
    LEFT JOIN LATERAL (
      SELECT dd.* FROM demandes dd WHERE dd.colis_id = c.id ORDER BY dd.created_at DESC LIMIT 1
    ) d ON true
    LEFT JOIN trajets t ON t.id = d.trajet_id`;

/** Connexion de base : le pool (hors transaction) ou un client (transaction). */
type Db = Pool | PoolClient;

function toListItem(row: ColisRow): ColisListeItem {
  return {
    id: row.id,
    reference: row.reference,
    description: row.description,
    statut: row.statut,
    villeOrigine: row.trajet_ville_depart ?? row.ville_origine,
    villeDestination: row.trajet_ville_arrivee ?? row.ville_destination,
    poidsKg: Number(row.poids_kg),
    devise: row.demande_devise ?? row.devise,
    montant: row.demande_prix === null ? null : Number(row.demande_prix),
    createdAt: row.created_at.toISOString(),
  };
}

async function loadColisRow(db: Db, colisId: string): Promise<ColisRow | null> {
  const result = await db.query<ColisRow>(`${COLIS_SELECT} WHERE c.id = $1`, [colisId]);
  return result.rows[0] ?? null;
}

async function loadEtapes(db: Db, colisId: string): Promise<PublicEtape[]> {
  const result = await db.query<{ etape: EtapeColis; occurred_at: Date; auteur_id: string | null }>(
    `SELECT etape, occurred_at, auteur_id
       FROM colis_etapes
      WHERE colis_id = $1
      ORDER BY occurred_at`,
    [colisId]
  );

  return result.rows.map((row) => ({
    etape: row.etape,
    occurredAt: row.occurred_at.toISOString(),
    auteurId: row.auteur_id,
  }));
}

async function loadEvaluation(db: Db, colisId: string): Promise<PublicEvaluation | null> {
  const result = await db.query<{
    id: string;
    note: number;
    commentaire: string | null;
    tags: string[] | null;
    created_at: Date;
  }>(
    `SELECT id, note, commentaire, tags, created_at
       FROM evaluations
      WHERE colis_id = $1
      LIMIT 1`,
    [colisId]
  );

  const row = result.rows[0];

  return row
    ? {
        id: row.id,
        note: row.note,
        commentaire: row.commentaire,
        tags: row.tags ?? [],
        createdAt: row.created_at.toISOString(),
      }
    : null;
}

async function loadReleasedAmount(
  db: Db,
  demandeId: string | null
): Promise<number | null> {
  if (!demandeId) {
    return null;
  }

  const result = await db.query<{ montant: string }>(
    `SELECT montant FROM paiements
      WHERE demande_id = $1 AND statut = 'valide'
      ORDER BY created_at DESC LIMIT 1`,
    [demandeId]
  );

  const row = result.rows[0];
  return row ? Number(row.montant) : null;
}

/** Première étape non enregistrée (null si toutes le sont). */
function nextEtape(recorded: EtapeColis[]): EtapeColis | null {
  return ETAPES.find((etape) => !recorded.includes(etape)) ?? null;
}

function resolveRole(row: ColisRow, userId: string): 'expediteur' | 'voyageur' {
  if (row.expediteur_id === userId) {
    return 'expediteur';
  }
  if (row.voyageur_id === userId) {
    return 'voyageur';
  }
  throw forbidden("Vous n'avez pas accès à ce colis.");
}

/** Colis de l'utilisateur connecté (en tant qu'expéditeur), paginés. */
export async function listColis(userId: string, limit: number, offset: number): Promise<ColisPage> {
  const [rows, count] = await Promise.all([
    pool.query<ColisRow>(
      `${COLIS_SELECT} WHERE c.expediteur_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query<{ total: string }>('SELECT count(*) AS total FROM colis WHERE expediteur_id = $1', [
      userId,
    ]),
  ]);

  return {
    items: rows.rows.map(toListItem),
    total: Number(count.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

/** Détail complet d'un colis (suivi), accessible à l'expéditeur et au voyageur. */
export async function getColisDetail(userId: string, colisId: string): Promise<ColisDetail> {
  const row = await loadColisRow(pool, colisId);

  if (!row) {
    throw notFound('Colis introuvable.');
  }

  const role = resolveRole(row, userId);

  const [expediteur, voyageur, etapes, evaluation, montantLibere] = await Promise.all([
    getPublicUserSummary(row.expediteur_id),
    row.voyageur_id ? getPublicUserSummary(row.voyageur_id) : Promise.resolve(null),
    loadEtapes(pool, colisId),
    loadEvaluation(pool, colisId),
    loadReleasedAmount(pool, row.demande_id),
  ]);

  if (!expediteur) {
    throw notFound('Expéditeur introuvable.');
  }

  const prochaineEtape = nextEtape(etapes.map((etape) => etape.etape));
  const cloture = row.statut === 'livre' || row.statut === 'annule';

  return {
    ...toListItem(row),
    role,
    expediteur,
    voyageur,
    trajetId: row.trajet_id,
    dateArriveePrevue: row.date_arrivee,
    etapes,
    prochaineEtape,
    peutConfirmerLivraison:
      role === 'expediteur' && !cloture && prochaineEtape === 'remis_destinataire',
    peutEvaluer: role === 'expediteur' && row.statut === 'livre' && !evaluation && !!row.voyageur_id,
    evaluation,
    montantLibere,
  };
}

/**
 * Enregistre l'étape suivante du suivi.
 * Réservé au voyageur du colis : les sauts d'étapes et les retours en arrière
 * sont refusés, chaque transition est consignée dans l'historique.
 */
export async function advanceEtape(
  userId: string,
  colisId: string,
  input: AdvanceEtapeInput
): Promise<ColisDetail> {
  const row = await loadColisRow(pool, colisId);

  if (!row) {
    throw notFound('Colis introuvable.');
  }

  if (row.voyageur_id !== userId) {
    throw forbidden('Seul le voyageur du colis peut enregistrer cette étape.');
  }

  if (row.statut === 'livre' || row.statut === 'annule') {
    throw conflict('Ce colis est déjà clôturé.');
  }

  const etapes = await loadEtapes(pool, colisId);
  const prochaine = nextEtape(etapes.map((etape) => etape.etape));

  if (prochaine === null) {
    throw conflict('Toutes les étapes ont déjà été enregistrées.');
  }

  if (input.etape !== prochaine) {
    throw conflict(
      `L'étape « ${ETAPE_LABELS[prochaine]} » doit être enregistrée avant celle-ci.`
    );
  }

  await pool.query(
    `INSERT INTO colis_etapes (colis_id, demande_id, etape, auteur_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (colis_id, etape) DO NOTHING`,
    [colisId, row.demande_id, input.etape, userId]
  );

  // Le colis passe « en transit » dès qu'il est remis au voyageur.
  await pool.query(
    `UPDATE colis SET statut = 'en_transit' WHERE id = $1 AND statut = 'en_attente'`,
    [colisId]
  );

  return getColisDetail(userId, colisId);
}

interface LockRow {
  id: string;
}

/**
 * Confirme la remise au destinataire (expéditeur uniquement) puis libère la
 * rémunération du voyageur.
 *
 * Opération atomique et idempotente : le montant libéré correspond au prix de
 * la demande (`demandes.prix`). Le portefeuille n'est crédité qu'une seule fois
 * par colis (contrôle d'un paiement « valide » existant sous verrou).
 */
export async function confirmDelivery(userId: string, colisId: string): Promise<ColisDetail> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lock = await client.query<LockRow>('SELECT id FROM colis WHERE id = $1 FOR UPDATE', [
      colisId,
    ]);

    if (lock.rowCount === 0) {
      throw notFound('Colis introuvable.');
    }

    const row = await loadColisRow(client, colisId);

    if (!row) {
      throw notFound('Colis introuvable.');
    }

    if (row.expediteur_id !== userId) {
      throw forbidden('Seul l’expéditeur du colis peut confirmer la livraison.');
    }

    // Déjà livré : on ne crédite pas une seconde fois.
    if (row.statut === 'livre') {
      await client.query('COMMIT');
      return getColisDetail(userId, colisId);
    }

    if (row.statut === 'annule') {
      throw conflict('Ce colis a été annulé.');
    }

    const etapes = await loadEtapes(client, colisId);
    const prochaine = nextEtape(etapes.map((etape) => etape.etape));

    if (prochaine !== 'remis_destinataire') {
      throw conflict(
        'Toutes les étapes précédentes doivent être enregistrées avant de confirmer la livraison.'
      );
    }

    await client.query(
      `INSERT INTO colis_etapes (colis_id, demande_id, etape, auteur_id)
       VALUES ($1, $2, 'remis_destinataire', $3)
       ON CONFLICT (colis_id, etape) DO NOTHING`,
      [colisId, row.demande_id, userId]
    );

    await client.query(`UPDATE colis SET statut = 'livre' WHERE id = $1`, [colisId]);

    if (row.demande_id) {
      await client.query(`UPDATE demandes SET statut = 'terminee' WHERE id = $1`, [row.demande_id]);

      const existing = await client.query(
        `SELECT 1 FROM paiements WHERE demande_id = $1 AND statut = 'valide' LIMIT 1`,
        [row.demande_id]
      );

      if ((existing.rowCount ?? 0) === 0 && row.voyageur_id) {
        const montant = Number(row.demande_prix ?? 0);
        const devise = row.demande_devise ?? 'MUR';

        await client.query(
          `INSERT INTO paiements (demande_id, payeur_id, beneficiaire_id, montant, devise, methode, statut)
           VALUES ($1, $2, $3, $4, $5, 'portefeuille', 'valide')`,
          [row.demande_id, row.expediteur_id, row.voyageur_id, montant, devise]
        );

        await client.query(
          `UPDATE users
              SET wallet_balance = wallet_balance + $2,
                  wallet_currency = $3
            WHERE id = $1`,
          [row.voyageur_id, montant, devise]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getColisDetail(userId, colisId);
}

/** Rémunération libérée pour un colis — visible par le voyageur concerné uniquement. */
export async function getRemuneration(userId: string, colisId: string): Promise<Remuneration> {
  const row = await loadColisRow(pool, colisId);

  if (!row) {
    throw notFound('Colis introuvable.');
  }

  if (row.voyageur_id !== userId) {
    throw forbidden('Cette rémunération ne vous est pas destinée.');
  }

  const montant = await loadReleasedAmount(pool, row.demande_id);
  const wallet = await getWallet(userId);

  return {
    montant: montant ?? 0,
    devise: row.demande_devise ?? wallet.currency,
    solde: wallet.balance,
    deviseSolde: wallet.currency,
    statut: row.statut,
  };
}

/**
 * Crée l'évaluation du voyageur par l'expéditeur du colis.
 * Règles : colis livré, une seule évaluation par colis, note de 1 à 5.
 */
export async function createEvaluation(
  userId: string,
  colisId: string,
  input: CreateEvaluationInput
): Promise<PublicEvaluation> {
  const row = await loadColisRow(pool, colisId);

  if (!row) {
    throw notFound('Colis introuvable.');
  }

  if (row.expediteur_id !== userId) {
    throw forbidden("Seul l'expéditeur du colis peut évaluer le voyageur.");
  }

  if (row.statut !== 'livre') {
    throw conflict("L'évaluation est disponible après la livraison du colis.");
  }

  if (!row.voyageur_id) {
    throw conflict('Aucun voyageur n’est associé à ce colis.');
  }

  const existing = await loadEvaluation(pool, colisId);

  if (existing) {
    throw conflict('Ce colis a déjà été évalué.');
  }

  // `demande_id` n'est pas renseigné : la contrainte d'unicité historique porte
  // sur cette colonne (une évaluation par demande), l'évaluation est désormais
  // identifiée par le colis (`evaluations.colis_id`, unique).
  const inserted = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO evaluations (colis_id, auteur_id, cible_id, note, commentaire, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [colisId, userId, row.voyageur_id, input.note, input.commentaire, input.tags]
  );

  const created = inserted.rows[0];

  if (!created) {
    throw new Error("L'enregistrement de l'évaluation a échoué.");
  }

  return {
    id: created.id,
    note: input.note,
    commentaire: input.commentaire,
    tags: input.tags,
    createdAt: created.created_at.toISOString(),
  };
}
