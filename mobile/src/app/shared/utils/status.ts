import {
  COLIS_STATUT_LABELS,
  type ColisStatut,
} from '../models/colis.model';
import type { TrajetStatut } from '../models/trajet.model';

/** Ton visuel d'un badge de statut. */
export type BadgeTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info';

export interface BadgeDescriptor {
  label: string;
  tone: BadgeTone;
}

const TRAJET_BADGES: Record<TrajetStatut, BadgeDescriptor> = {
  publie: { label: 'Publié', tone: 'success' },
  complet: { label: 'Complet', tone: 'info' },
  termine: { label: 'Terminé', tone: 'neutral' },
  brouillon: { label: 'Brouillon', tone: 'warning' },
  annule: { label: 'Annulé', tone: 'danger' },
};

const COLIS_BADGES: Record<ColisStatut, BadgeDescriptor> = {
  en_transit: { label: COLIS_STATUT_LABELS.en_transit, tone: 'success' },
  livre: { label: COLIS_STATUT_LABELS.livre, tone: 'neutral' },
  en_attente: { label: COLIS_STATUT_LABELS.en_attente, tone: 'warning' },
  annule: { label: COLIS_STATUT_LABELS.annule, tone: 'danger' },
};

/** Badge d'un statut de trajet. */
export function trajetBadge(statut: TrajetStatut): BadgeDescriptor {
  return TRAJET_BADGES[statut] ?? { label: statut, tone: 'neutral' };
}

/** Badge d'un statut de colis. */
export function colisBadge(statut: ColisStatut): BadgeDescriptor {
  return COLIS_BADGES[statut] ?? { label: statut, tone: 'neutral' };
}
