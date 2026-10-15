/** Statuts possibles d'un trajet (valeurs du schéma). */
export type TrajetStatut = 'brouillon' | 'publie' | 'complet' | 'termine' | 'annule';

/** Trajet publié par un voyageur. */
export interface Trajet {
  id: string;
  /** Identifiant du voyageur (pour ouvrir ses avis). */
  voyageurId: string;
  villeDepart: string;
  villeArrivee: string;
  paysDepart: string | null;
  paysArrivee: string | null;
  /** Date au format AAAA-MM-JJ. */
  dateDepart: string;
  /** Date au format AAAA-MM-JJ. */
  dateArrivee: string | null;
  poidsDisponibleKg: number;
  prixParKg: number | null;
  devise: string;
  compagnieAerienne: string | null;
  numeroVol: string | null;
  informationsSupplementaires: string | null;
  statut: TrajetStatut;
  createdAt: string;
}

/** Réponse de `GET /api/trajets/me`. */
export interface TrajetPage {
  items: Trajet[];
  total: number;
}

/** Données envoyées à `POST /api/trajets`. */
export interface CreateTrajetPayload {
  departIata: string;
  arriveeIata: string;
  dateDepart: string;
  dateArrivee: string;
  poidsDisponibleKg: number;
  prixParKg: number;
  compagnieAerienne: string;
  numeroVol: string;
  informationsSupplementaires: string | null;
}

/** Aéroport / ville de référence renvoyé par `GET /api/airports`. */
export interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
  /** Libellé affiché : « Ville (CODE) ». */
  label: string;
}

export interface AirportSearchResponse {
  items: Airport[];
}

/**
 * Limites de validation, identiques à celles du backend
 * (`backend/src/utils/validation.ts`).
 */
export const TRAJET_LIMITS = {
  maxWeightKg: 50,
  maxPricePerKg: 50000,
  airlineMaxLength: 120,
  flightNumberMaxLength: 20,
  notesMaxLength: 500,
} as const;

/** Symbole de la devise de l'application (roupie mauricienne). */
export const CURRENCY_SYMBOL = 'Rs';

/** Informations publiques d'un membre (voyageur ou expéditeur). */
export interface PublicUserSummary {
  id: string;
  /** Nom affiché : nom complet ou « Prénom N. » selon ses préférences. */
  displayName: string;
  photoUrl: string | null;
  isVerified: boolean;
  noteMoyenne: number;
  nombreAvis: number;
  /** Nombre de trajets publiés (0 si masqué par l'utilisateur). */
  nombreVoyages: number;
  /** `false` si le membre masque son nombre de voyages. */
  voyagesVisibles: boolean;
}

/** Détail d'un trajet (écran « Détails du trajet »). */
export interface TrajetDetail extends Trajet {
  voyageur: PublicUserSummary;
  /** L'utilisateur connecté est le propriétaire du trajet. */
  estProprietaire: boolean;
  peutFaireDemande: boolean;
}

/**
 * Engagements de la plateforme affichés sur le détail d'un trajet
 * (textes de politique, centralisés ici).
 */
export const TRAJET_POLICY_ITEMS = [
  'Colis vérifié avant le départ',
  'Remise en main propre uniquement',
];
