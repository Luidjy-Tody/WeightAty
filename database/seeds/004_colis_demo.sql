-- =============================================================================
-- Weight'Aty — Données de démonstration : suivi des colis
-- -----------------------------------------------------------------------------
-- Complète les colis du seed : itinéraire, devise, historique des étapes,
-- rémunération des colis livrés et solde des portefeuilles.
-- À exécuter APRÈS les migrations. Réexécutable sans effet de bord.
-- =============================================================================

-- Itinéraires et devise ------------------------------------------------------
UPDATE colis SET ville_origine = 'Paris (CDG)',     ville_destination = 'Dakar (DKR)',   devise = 'MUR' WHERE id = 'c1111111-0000-0000-0000-000000000001';
UPDATE colis SET ville_origine = 'Lyon (LYS)',      ville_destination = 'Bruxelles (BRU)', devise = 'MUR' WHERE id = 'c1111111-0000-0000-0000-000000000002';
UPDATE colis SET ville_origine = 'Marseille (MRS)', ville_destination = 'Alger (ALG)',   devise = 'MUR' WHERE id = 'c1111111-0000-0000-0000-000000000003';
UPDATE colis SET ville_origine = 'Marseille (MRS)', ville_destination = 'Alger (ALG)',   devise = 'MUR' WHERE id = 'c1111111-0000-0000-0000-000000000004';

UPDATE demandes SET devise = 'MUR' WHERE devise <> 'MUR';
UPDATE paiements SET devise = 'MUR' WHERE devise <> 'MUR';

-- Historique des étapes ------------------------------------------------------
-- c001 : demande envoyée seulement (en attente).
INSERT INTO colis_etapes (colis_id, demande_id, etape, occurred_at, auteur_id) VALUES
  ('c1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000003', 'demande_envoyee',    now() - interval '6 days',  '11111111-1111-1111-1111-111111111111')
ON CONFLICT (colis_id, etape) DO NOTHING;

-- c002 : en transit aujourd'hui (étape en cours).
INSERT INTO colis_etapes (colis_id, demande_id, etape, occurred_at, auteur_id) VALUES
  ('c1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000004', 'demande_envoyee',    now() - interval '9 days',  '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000004', 'demande_acceptee',   now() - interval '8 days',  '33333333-3333-3333-3333-333333333333'),
  ('c1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000004', 'remis_voyageur',     now() - interval '3 days',  '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000004', 'en_transit',         date_trunc('day', now()) + interval '8 hours 10 minutes', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (colis_id, etape) DO NOTHING;

-- c003 : livré (voyageur Karim).
INSERT INTO colis_etapes (colis_id, demande_id, etape, occurred_at, auteur_id) VALUES
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'demande_envoyee',     now() - interval '40 days', '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'demande_acceptee',    now() - interval '39 days', '33333333-3333-3333-3333-333333333333'),
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'remis_voyageur',      now() - interval '35 days', '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'en_transit',          now() - interval '34 days', '33333333-3333-3333-3333-333333333333'),
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'arrive_destination',  now() - interval '31 days', '33333333-3333-3333-3333-333333333333'),
  ('c1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'remis_destinataire',  now() - interval '30 days', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (colis_id, etape) DO NOTHING;

-- c004 : livré (voyageur Marie).
INSERT INTO colis_etapes (colis_id, demande_id, etape, occurred_at, auteur_id) VALUES
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'demande_envoyee',     now() - interval '20 days', '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'demande_acceptee',    now() - interval '19 days', '22222222-2222-2222-2222-222222222222'),
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'remis_voyageur',      now() - interval '15 days', '11111111-1111-1111-1111-111111111111'),
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'en_transit',          now() - interval '14 days', '22222222-2222-2222-2222-222222222222'),
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'arrive_destination',  now() - interval '11 days', '22222222-2222-2222-2222-222222222222'),
  ('c1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000002', 'remis_destinataire',  now() - interval '10 days', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (colis_id, etape) DO NOTHING;

-- Rémunération des colis livrés (déjà versée au voyageur) --------------------
INSERT INTO paiements (id, demande_id, payeur_id, beneficiaire_id, montant, devise, methode, statut) VALUES
  ('f1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 8.00,  'MUR', 'portefeuille', 'valide'),
  ('f1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 50.00, 'MUR', 'portefeuille', 'valide')
ON CONFLICT (id) DO NOTHING;

-- Solde des portefeuilles = somme des rémunérations reçues -------------------
UPDATE users
   SET wallet_balance = coalesce((
         SELECT sum(p.montant) FROM paiements p
          WHERE p.beneficiaire_id = users.id AND p.statut = 'valide'
       ), 0),
       wallet_currency = 'MUR';
