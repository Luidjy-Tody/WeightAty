-- =============================================================================
-- Weight'Aty — Jeu de données de développement
-- -----------------------------------------------------------------------------
-- Ce script alimente la base avec des comptes de démonstration afin de pouvoir
-- tester l'application (connexion, profil, statistiques, évaluations).
--
-- Tous les comptes de démonstration partagent le mot de passe : motdepasse123
--   - expéditeur : jean.dupont@example.com   (colis + trajets)
--   - voyageur   : marie.lambert@example.com (trajets)
--   - admin      : admin@weightaty.example   (rôle administrateur)
--
-- La colonne `demo_role` identifie les comptes utilisés par l'accès démo :
--   GET /api/auth/demo-accounts et POST /api/auth/demo-login.
--
-- À ne PAS exécuter en production.
-- =============================================================================

-- Utilisateurs ---------------------------------------------------------------
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_verified, verified_at, is_active, demo_role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'jean.dupont@example.com',
   'scrypt$f308a82a80b28452b4ed59eda656e178$a417dc5a9fee46766232897ca0693ebb3005bd0a59082f4d4e64f8bb3396bac6367c3f1cbfbaa777b5a1024b1317ac98c05bf3e79a08ce8414e0fb6615e98ed9',
   'Jean', 'Dupont', '+33 6 12 34 56 78', 'utilisateur', true, now(), true, 'expediteur'),
  ('22222222-2222-2222-2222-222222222222', 'marie.lambert@example.com',
   'scrypt$f308a82a80b28452b4ed59eda656e178$a417dc5a9fee46766232897ca0693ebb3005bd0a59082f4d4e64f8bb3396bac6367c3f1cbfbaa777b5a1024b1317ac98c05bf3e79a08ce8414e0fb6615e98ed9',
   'Marie', 'Lambert', NULL, 'utilisateur', true, now(), true, 'voyageur'),
  ('33333333-3333-3333-3333-333333333333', 'karim.benali@example.com',
   'scrypt$f308a82a80b28452b4ed59eda656e178$a417dc5a9fee46766232897ca0693ebb3005bd0a59082f4d4e64f8bb3396bac6367c3f1cbfbaa777b5a1024b1317ac98c05bf3e79a08ce8414e0fb6615e98ed9',
   'Karim', 'Benali', NULL, 'utilisateur', false, NULL, true, NULL),
  ('44444444-4444-4444-4444-444444444444', 'admin@weightaty.example',
   'scrypt$f308a82a80b28452b4ed59eda656e178$a417dc5a9fee46766232897ca0693ebb3005bd0a59082f4d4e64f8bb3396bac6367c3f1cbfbaa777b5a1024b1317ac98c05bf3e79a08ce8414e0fb6615e98ed9',
   'Ada', 'Ministrateur', NULL, 'administrateur', true, now(), true, 'admin')
ON CONFLICT (id) DO NOTHING;

-- Les bases déjà initialisées avec une version antérieure du seed ne sont pas
-- mises à jour par l'INSERT ci-dessus : on réaffecte donc explicitement les
-- rôles de démonstration.
UPDATE users SET demo_role = 'expediteur' WHERE email = 'jean.dupont@example.com';
UPDATE users SET demo_role = 'voyageur'   WHERE email = 'marie.lambert@example.com';
UPDATE users SET demo_role = 'admin', role = 'administrateur' WHERE email = 'admin@weightaty.example';
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Trajets publiés par Jean (voyageur) ----------------------------------------
INSERT INTO trajets (id, voyageur_id, ville_depart, ville_arrivee, pays_depart, pays_arrivee, date_depart, date_arrivee, capacite_kg, prix_par_kg, statut)
VALUES
  ('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Paris', 'Dakar', 'France', 'Sénégal', now() + interval '10 days', now() + interval '11 days', 20.00, 12.50, 'publie'),
  ('a1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Lyon', 'Bruxelles', 'France', 'Belgique', now() + interval '20 days', now() + interval '20 days', 12.00, 8.00, 'publie'),
  ('a1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Marseille', 'Alger', 'France', 'Algérie', now() - interval '30 days', now() - interval '30 days', 15.00, 10.00, 'termine')
ON CONFLICT (id) DO NOTHING;

-- Trajets publiés par Marie (compte démo « voyageur ») -----------------------
INSERT INTO trajets (id, voyageur_id, ville_depart, ville_arrivee, pays_depart, pays_arrivee, date_depart, date_arrivee, capacite_kg, prix_par_kg, statut)
VALUES
  ('a2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Toulouse', 'Casablanca', 'France', 'Maroc', now() + interval '15 days', now() + interval '15 days', 18.00, 11.00, 'publie'),
  ('a2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Nantes', 'Genève', 'France', 'Suisse', now() + interval '28 days', now() + interval '29 days', 10.00, 9.50, 'publie')
ON CONFLICT (id) DO NOTHING;

-- Colis publiés par Jean (expéditeur) ---------------------------------------
INSERT INTO colis (id, expediteur_id, description, poids_kg, valeur_declaree, statut)
VALUES
  ('c1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Documents administratifs', 0.50, 0, 'en_attente'),
  ('c1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Vêtements', 3.20, 80.00, 'en_transit'),
  ('c1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Téléphone', 0.80, 350.00, 'livre'),
  ('c1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Livres', 5.00, 40.00, 'livre')
ON CONFLICT (id) DO NOTHING;

-- Demandes (transactions) ---------------------------------------------------
-- 3 transactions terminées + 1 annulée => fiabilité de 75 %.
INSERT INTO demandes (id, colis_id, trajet_id, expediteur_id, voyageur_id, prix, litige, statut)
VALUES
  ('d1111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 8.00, false, 'terminee'),
  ('d1111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 50.00, false, 'terminee'),
  ('d1111111-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001', NULL, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 6.25, false, 'terminee'),
  ('d1111111-0000-0000-0000-000000000004', 'c1111111-0000-0000-0000-000000000002', NULL, '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 25.60, true, 'annulee')
ON CONFLICT (id) DO NOTHING;

-- Évaluations reçues par Jean ------------------------------------------------
INSERT INTO evaluations (id, demande_id, auteur_id, cible_id, note, commentaire, created_at)
VALUES
  ('e1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'Personne très sérieuse, colis remis en parfait état. Je recommande !', now() - interval '3 days'),
  ('e1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 4, 'Communication claire et ponctuelle. Merci pour la confiance.', now() - interval '14 days'),
  ('e1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 5, 'Transaction fluide du début à la fin.', now() - interval '45 days')
ON CONFLICT (id) DO NOTHING;
