import type { PublicUserSummary } from './trajet.model';

/** Paiement affiché dans l'historique. */
export interface Paiement {
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
  items: Paiement[];
  total: number;
  limit: number;
  offset: number;
}
