import type { PublicUserSummary } from './trajet.model';

/** Statuts possibles d'un colis (valeurs du schéma). */
export type ColisStatut = 'en_attente' | 'en_transit' | 'livre' | 'annule';

/** Étapes du suivi d'un colis, dans l'ordre. */
export type EtapeColis =
  | 'demande_envoyee'
  | 'demande_acceptee'
  | 'remis_voyageur'
  | 'en_transit'
  | 'arrive_destination'
  | 'remis_destinataire';

/** Ordre officiel des étapes (identique au backend). */
export const ETAPES_COLIS: EtapeColis[] = [
  'demande_envoyee',
  'demande_acceptee',
  'remis_voyageur',
  'en_transit',
  'arrive_destination',
  'remis_destinataire',
];

/** Libellés français des étapes du suivi. */
export const ETAPE_LABELS: Record<EtapeColis, string> = {
  demande_envoyee: 'Demande envoyée',
  demande_acceptee: 'Demande acceptée',
  remis_voyageur: 'Colis remis au voyageur',
  en_transit: 'En transit',
  arrive_destination: 'Arrivé à destination',
  remis_destinataire: 'Colis remis au destinataire',
};

/** Libellés français des statuts de colis. */
export const COLIS_STATUT_LABELS: Record<ColisStatut, string> = {
  en_attente: 'En attente',
  en_transit: 'En transit',
  livre: 'Livré',
  annule: 'Annulé',
};

/** Étape enregistrée dans l'historique du colis. */
export interface EtapeColisItem {
  etape: EtapeColis;
  occurredAt: string;
  auteurId: string | null;
}

/** Évaluation d'un voyageur par l'expéditeur. */
export interface Evaluation {
  id: string;
  note: number;
  commentaire: string | null;
  tags: string[];
  createdAt: string;
}

/** Colis tel qu'affiché dans la liste « Mes colis ». */
export interface ColisListItem {
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

/** Détail complet d'un colis (suivi). */
export interface ColisDetail extends ColisListItem {
  role: 'expediteur' | 'voyageur';
  expediteur: PublicUserSummary;
  voyageur: PublicUserSummary | null;
  trajetId: string | null;
  dateArriveePrevue: string | null;
  etapes: EtapeColisItem[];
  prochaineEtape: EtapeColis | null;
  peutConfirmerLivraison: boolean;
  peutEvaluer: boolean;
  evaluation: Evaluation | null;
  montantLibere: number | null;
}

export interface ColisPage {
  items: ColisListItem[];
  total: number;
  limit: number;
  offset: number;
}

/** Rémunération libérée pour un colis (vue du voyageur). */
export interface Remuneration {
  montant: number;
  devise: string;
  solde: number;
  deviseSolde: string;
  statut: ColisStatut;
}

/** Étapes qu'un voyageur peut enregistrer depuis l'application. */
export const ETAPES_VOYAGEUR: EtapeColis[] = [
  'remis_voyageur',
  'en_transit',
  'arrive_destination',
];

/** Puces proposées lors de l'évaluation. */
export const EVALUATION_TAGS = ['Ponctuel', 'Bonne communication', 'Colis bien traité'];

/** Limite du commentaire d'évaluation. */
export const EVALUATION_COMMENT_MAX = 500;
