/** Motifs de signalement proposés (clés alignées sur le backend). */
export interface SignalementMotif {
  value: string;
  label: string;
}

export const SIGNALEMENT_MOTIFS: SignalementMotif[] = [
  { value: 'retard', label: 'Retard important' },
  { value: 'comportement', label: 'Comportement inapproprié' },
  { value: 'colis_endommage', label: 'Colis endommagé' },
  { value: 'non_conforme', label: 'Annonce non conforme' },
  { value: 'autre', label: 'Autre' },
];

/** Limite du message de signalement. */
export const SIGNALEMENT_MESSAGE_MAX = 1000;
