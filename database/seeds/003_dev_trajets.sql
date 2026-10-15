-- =============================================================================
-- Weight'Aty — Trajets de démonstration (complément)
-- -----------------------------------------------------------------------------
-- Harmonise les trajets du seed avec le format d'affichage « Ville (CODE) »,
-- la devise de l'application (roupie mauricienne, symbole « Rs ») et renseigne
-- les informations de vol ajoutées par la migration 004.
-- À exécuter APRÈS les migrations. Réexécutable sans effet de bord.
-- =============================================================================

UPDATE trajets SET
  ville_depart = 'Paris (CDG)', ville_arrivee = 'Dakar (DKR)', devise = 'MUR',
  compagnie_aerienne = 'Air Sénégal', numero_vol = 'HC 403',
  informations_supplementaires = 'Documents et petits colis uniquement.'
WHERE id = 'a1111111-0000-0000-0000-000000000001';

UPDATE trajets SET
  ville_depart = 'Lyon (LYS)', ville_arrivee = 'Bruxelles (BRU)', devise = 'MUR',
  compagnie_aerienne = 'Brussels Airlines', numero_vol = 'SN 3598'
WHERE id = 'a1111111-0000-0000-0000-000000000002';

UPDATE trajets SET
  ville_depart = 'Marseille (MRS)', ville_arrivee = 'Alger (ALG)', devise = 'MUR',
  compagnie_aerienne = 'Air Algérie', numero_vol = 'AH 1021'
WHERE id = 'a1111111-0000-0000-0000-000000000003';

UPDATE trajets SET
  ville_depart = 'Toulouse (TLS)', ville_arrivee = 'Casablanca (CMN)', devise = 'MUR',
  compagnie_aerienne = 'Royal Air Maroc', numero_vol = 'AT 795'
WHERE id = 'a2222222-0000-0000-0000-000000000001';

UPDATE trajets SET
  ville_depart = 'Nantes (NTE)', ville_arrivee = 'Genève (GVA)', devise = 'MUR',
  compagnie_aerienne = 'Swiss', numero_vol = 'LX 1129'
WHERE id = 'a2222222-0000-0000-0000-000000000002';
