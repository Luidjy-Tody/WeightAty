import { pool } from '../../config/database.js';
import { forbidden, notFound, unauthorized, validationError } from '../../utils/http-error.js';
import { APP_CURRENCY, type CreateTrajetInput } from '../../utils/validation.js';
import { findAirportsByIata } from '../airports/airport.service.js';
import {
  findUserById,
  getPublicUserSummary,
  type PublicUserSummary,
} from '../users/user.service.js';

/**
 * Règle métier : la publication d'un trajet est réservée aux comptes actifs.
 * Aucun rôle « voyageur » n'existe encore en base — tout utilisateur actif peut
 * proposer son espace bagage. Passer ce drapeau à `true` exigera un profil
 * vérifié, dès qu'un parcours de vérification existera (point à valider).
 */
const REQUIRE_VERIFIED_TO_PUBLISH = false;

/** Statut initial d'un trajet publié (valeur existante du schéma). */
const INITIAL_STATUS = 'publie';

/** Trajet exposé par l'API. */
export interface PublicTrajet {
  id: string;
  voyageurId: string;
  villeDepart: string;
  villeArrivee: string;
  paysDepart: string | null;
  paysArrivee: string | null;
  dateDepart: string;
  dateArrivee: string | null;
  poidsDisponibleKg: number;
  prixParKg: number | null;
  devise: string;
  compagnieAerienne: string | null;
  numeroVol: string | null;
  informationsSupplementaires: string | null;
  statut: string;
  createdAt: string;
}

interface TrajetRow {
  id: string;
  voyageur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  pays_depart: string | null;
  pays_arrivee: string | null;
  date_depart: string;
  date_arrivee: string | null;
  capacite_kg: string;
  prix_par_kg: string | null;
  devise: string;
  compagnie_aerienne: string | null;
  numero_vol: string | null;
  informations_supplementaires: string | null;
  statut: string;
  created_at: Date;
}

const TRAJET_SELECT = `
  SELECT t.id,
         t.voyageur_id,
         t.ville_depart,
         t.ville_arrivee,
         t.pays_depart,
         t.pays_arrivee,
         to_char(t.date_depart, 'YYYY-MM-DD')  AS date_depart,
         to_char(t.date_arrivee, 'YYYY-MM-DD') AS date_arrivee,
         t.capacite_kg,
         t.prix_par_kg,
         t.devise,
         t.compagnie_aerienne,
         t.numero_vol,
         t.informations_supplementaires,
         t.statut,
         t.created_at
    FROM trajets t`;

function toPublicTrajet(row: TrajetRow): PublicTrajet {
  return {
    id: row.id,
    voyageurId: row.voyageur_id,
    villeDepart: row.ville_depart,
    villeArrivee: row.ville_arrivee,
    paysDepart: row.pays_depart,
    paysArrivee: row.pays_arrivee,
    dateDepart: row.date_depart,
    dateArrivee: row.date_arrivee,
    poidsDisponibleKg: Number(row.capacite_kg),
    prixParKg: row.prix_par_kg === null ? null : Number(row.prix_par_kg),
    devise: row.devise,
    compagnieAerienne: row.compagnie_aerienne,
    numeroVol: row.numero_vol,
    informationsSupplementaires: row.informations_supplementaires,
    statut: row.statut,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Vérifie que l'utilisateur connecté est autorisé à publier un trajet.
 * Lève une erreur explicite en français sinon.
 */
export async function assertCanPublishTrajet(userId: string): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw unauthorized('Session invalide, veuillez vous reconnecter.');
  }

  if (!user.is_active) {
    throw forbidden('Ce compte a été désactivé. Veuillez contacter le support.');
  }

  if (REQUIRE_VERIFIED_TO_PUBLISH && !user.is_verified) {
    throw forbidden('Votre profil doit être vérifié pour publier un trajet.');
  }
}

/** Récupère un trajet par son identifiant. */
export async function getTrajetById(id: string): Promise<PublicTrajet | null> {
  const result = await pool.query<TrajetRow>(`${TRAJET_SELECT} WHERE t.id = $1`, [id]);
  const row = result.rows[0];
  return row ? toPublicTrajet(row) : null;
}

/** Détail d'un trajet pour l'écran « Détails du trajet ». */
export interface TrajetDetail extends PublicTrajet {
  /** Informations publiques du voyageur (nom abrégé, photo, note, avis, voyages). */
  voyageur: PublicUserSummary;
  /** L'utilisateur connecté est-il le propriétaire (voyageur) du trajet ? */
  estProprietaire: boolean;
  /** Une demande peut-elle être faite sur ce trajet ? */
  peutFaireDemande: boolean;
}

/**
 * Détail d'un trajet accessible à tout utilisateur connecté.
 * Aucune donnée personnelle sensible du voyageur n'est exposée.
 */
export async function getTrajetDetail(userId: string, trajetId: string): Promise<TrajetDetail> {
  const trajet = await getTrajetById(trajetId);

  if (!trajet) {
    throw notFound('Trajet introuvable.');
  }

  const voyageur = await getPublicUserSummary(trajet.voyageurId);

  if (!voyageur) {
    throw notFound('Voyageur introuvable.');
  }

  const estProprietaire = trajet.voyageurId === userId;

  return {
    ...trajet,
    voyageur,
    estProprietaire,
    peutFaireDemande: !estProprietaire && trajet.statut === 'publie',
  };
}

/** Trajets publiés par un voyageur (les plus récents d'abord). */
export async function listTrajetsByVoyageur(userId: string): Promise<PublicTrajet[]> {
  const result = await pool.query<TrajetRow>(
    `${TRAJET_SELECT} WHERE t.voyageur_id = $1 ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows.map(toPublicTrajet);
}

/**
 * Crée un trajet pour l'utilisateur connecté.
 * Les libellés « Ville (CODE) » et les pays sont déduits de la table de
 * référence `airports` : le client ne transmet que les codes IATA.
 */
export async function createTrajet(
  userId: string,
  input: CreateTrajetInput
): Promise<PublicTrajet> {
  const airports = await findAirportsByIata([input.departIata, input.arriveeIata]);
  const depart = airports.get(input.departIata);
  const arrivee = airports.get(input.arriveeIata);

  if (!depart || !arrivee) {
    const errors: Record<string, string> = {};
    if (!depart) {
      errors['departIata'] = "L'aéroport de départ est inconnu.";
    }
    if (!arrivee) {
      errors['arriveeIata'] = "L'aéroport de destination est inconnu.";
    }
    throw validationError(errors);
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO trajets (
        voyageur_id, ville_depart, ville_arrivee, pays_depart, pays_arrivee,
        date_depart, date_arrivee, capacite_kg, prix_par_kg, devise, statut,
        compagnie_aerienne, numero_vol, informations_supplementaires
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      userId,
      depart.label,
      arrivee.label,
      depart.country,
      arrivee.country,
      input.dateDepart,
      input.dateArrivee,
      input.poidsDisponibleKg,
      input.prixParKg,
      APP_CURRENCY,
      INITIAL_STATUS,
      input.compagnieAerienne,
      input.numeroVol,
      input.informationsSupplementaires,
    ]
  );

  const id = inserted.rows[0]?.id;

  if (!id) {
    throw new Error("La création du trajet a échoué.");
  }

  const trajet = await getTrajetById(id);

  if (!trajet) {
    throw new Error("Le trajet créé est introuvable.");
  }

  return trajet;
}
