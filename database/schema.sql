-- >>> 001_init.sql
-- =============================================================================
-- Weight'Aty — Migration 001 : schéma initial
-- -----------------------------------------------------------------------------
-- Ce script crée les tables de base nécessaires au fonctionnement de
-- l'application (utilisateurs, trajets, colis, demandes, paiements, évaluations).
-- Il est idempotent : il peut être rejoué sans erreur.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Fonction utilitaire : mise à jour automatique du champ updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Utilisateurs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  role          VARCHAR(20) NOT NULL DEFAULT 'utilisateur',
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  verified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_role_check CHECK (role IN ('utilisateur', 'administrateur'))
);

CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Trajets (proposés par les voyageurs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trajets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voyageur_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ville_depart  VARCHAR(120) NOT NULL,
  ville_arrivee VARCHAR(120) NOT NULL,
  pays_depart   VARCHAR(120),
  pays_arrivee  VARCHAR(120),
  date_depart   TIMESTAMPTZ NOT NULL,
  date_arrivee  TIMESTAMPTZ,
  capacite_kg   NUMERIC(6, 2) NOT NULL DEFAULT 0,
  prix_par_kg   NUMERIC(10, 2),
  devise        VARCHAR(3) NOT NULL DEFAULT 'EUR',
  statut        VARCHAR(20) NOT NULL DEFAULT 'publie',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trajets_statut_check
    CHECK (statut IN ('brouillon', 'publie', 'complet', 'termine', 'annule')),
  CONSTRAINT trajets_capacite_check CHECK (capacite_kg >= 0)
);

CREATE INDEX IF NOT EXISTS trajets_voyageur_idx ON trajets (voyageur_id);
CREATE INDEX IF NOT EXISTS trajets_statut_idx ON trajets (statut);

DROP TRIGGER IF EXISTS trajets_set_updated_at ON trajets;
CREATE TRIGGER trajets_set_updated_at
  BEFORE UPDATE ON trajets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Colis (publiés par les expéditeurs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  description     VARCHAR(500) NOT NULL,
  poids_kg        NUMERIC(6, 2) NOT NULL DEFAULT 0,
  valeur_declaree NUMERIC(10, 2),
  devise          VARCHAR(3) NOT NULL DEFAULT 'EUR',
  statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT colis_statut_check
    CHECK (statut IN ('en_attente', 'en_transit', 'livre', 'annule')),
  CONSTRAINT colis_poids_check CHECK (poids_kg >= 0)
);

CREATE INDEX IF NOT EXISTS colis_expediteur_idx ON colis (expediteur_id);
CREATE INDEX IF NOT EXISTS colis_statut_idx ON colis (statut);

DROP TRIGGER IF EXISTS colis_set_updated_at ON colis;
CREATE TRIGGER colis_set_updated_at
  BEFORE UPDATE ON colis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Demandes (mise en relation colis <-> trajet)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demandes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id      UUID NOT NULL REFERENCES colis (id) ON DELETE CASCADE,
  trajet_id     UUID REFERENCES trajets (id) ON DELETE SET NULL,
  expediteur_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  voyageur_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  prix          NUMERIC(10, 2),
  devise        VARCHAR(3) NOT NULL DEFAULT 'EUR',
  -- litige = true lorsqu'un litige a été signalé sur la transaction.
  litige        BOOLEAN NOT NULL DEFAULT false,
  statut        VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT demandes_statut_check
    CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'annulee', 'terminee'))
);

CREATE INDEX IF NOT EXISTS demandes_colis_idx ON demandes (colis_id);
CREATE INDEX IF NOT EXISTS demandes_trajet_idx ON demandes (trajet_id);
CREATE INDEX IF NOT EXISTS demandes_expediteur_idx ON demandes (expediteur_id);
CREATE INDEX IF NOT EXISTS demandes_voyageur_idx ON demandes (voyageur_id);
CREATE INDEX IF NOT EXISTS demandes_statut_idx ON demandes (statut);

DROP TRIGGER IF EXISTS demandes_set_updated_at ON demandes;
CREATE TRIGGER demandes_set_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Paiements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paiements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id      UUID NOT NULL REFERENCES demandes (id) ON DELETE CASCADE,
  payeur_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  beneficiaire_id UUID REFERENCES users (id) ON DELETE SET NULL,
  montant         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  devise          VARCHAR(3) NOT NULL DEFAULT 'EUR',
  methode         VARCHAR(30),
  statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paiements_statut_check
    CHECK (statut IN ('en_attente', 'valide', 'rembourse', 'echoue'))
);

CREATE INDEX IF NOT EXISTS paiements_demande_idx ON paiements (demande_id);
CREATE INDEX IF NOT EXISTS paiements_payeur_idx ON paiements (payeur_id);

-- -----------------------------------------------------------------------------
-- Évaluations (avis laissés après une transaction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id  UUID UNIQUE REFERENCES demandes (id) ON DELETE CASCADE,
  auteur_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  cible_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  note        SMALLINT NOT NULL,
  commentaire TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT evaluations_note_check CHECK (note BETWEEN 1 AND 5),
  CONSTRAINT evaluations_auteurs_check CHECK (auteur_id <> cible_id)
);

CREATE INDEX IF NOT EXISTS evaluations_cible_idx ON evaluations (cible_id);
CREATE INDEX IF NOT EXISTS evaluations_auteur_idx ON evaluations (auteur_id);

-- >>> 002_revoked_tokens.sql
-- =============================================================================
-- Weight'Aty — Migration 002 : révocation des jetons de session
-- -----------------------------------------------------------------------------
-- Permet d'invalider un jeton côté serveur lors de la déconnexion.
-- =============================================================================

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        UUID PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revoked_tokens_expires_idx ON revoked_tokens (expires_at);

-- >>> 003_auth_login.sql
-- =============================================================================
-- Weight'Aty — Migration 003 : connexion (compte actif + comptes de démo)
-- -----------------------------------------------------------------------------
-- - `is_active`  : permet de désactiver un compte (connexion refusée).
-- - `demo_role`  : identifie les comptes utilisés par l'accès démo
--                  (expéditeur / voyageur / admin). NULL pour les autres.
--                  Aucun identifiant n'est exposé au client : seul le rôle
--                  (un libellé) est renvoyé par l'API.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_role VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_demo_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_demo_role_check
      CHECK (demo_role IS NULL OR demo_role IN ('expediteur', 'voyageur', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_demo_role_idx
  ON users (demo_role)
  WHERE demo_role IS NOT NULL;

-- >>> 004_trajets.sql
-- =============================================================================
-- Weight'Aty — Migration 004 : création de trajet
-- -----------------------------------------------------------------------------
-- - Complète la table `trajets` avec les informations de vol.
-- - Ajoute la table de référence `airports` (aéroports / villes) utilisée par
--   l'autocomplétion des champs Départ et Destination.
-- Aucune donnée existante n'est modifiée.
-- =============================================================================

-- Informations de vol ---------------------------------------------------------
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS compagnie_aerienne VARCHAR(120);
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS numero_vol VARCHAR(20);
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS informations_supplementaires VARCHAR(500);

-- Aéroports / villes de référence --------------------------------------------
CREATE TABLE IF NOT EXISTS airports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code  VARCHAR(3) NOT NULL,
  city       VARCHAR(120) NOT NULL,
  country    VARCHAR(120) NOT NULL,
  name       VARCHAR(160) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT airports_iata_unique UNIQUE (iata_code),
  CONSTRAINT airports_iata_format CHECK (iata_code ~ '^[A-Z]{3}$')
);

CREATE INDEX IF NOT EXISTS airports_iata_idx ON airports (iata_code);
CREATE INDEX IF NOT EXISTS airports_city_lower_idx ON airports (lower(city));
CREATE INDEX IF NOT EXISTS airports_country_lower_idx ON airports (lower(country));

-- >>> 005_profile.sql
-- =============================================================================
-- Weight'Aty — Migration 005 : informations personnelles
-- -----------------------------------------------------------------------------
-- - `address`   : adresse postale de l'utilisateur (facultative).
-- - `photo_url` : chemin de la photo de profil servie par l'API
--                 (ex. « /uploads/avatars/<uuid>.jpg »), NULL = initiales.
-- Aucune donnée existante n'est modifiée.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- >>> 006_colis_suivi.sql
-- =============================================================================
-- Weight'Aty — Migration 006 : suivi des colis, rémunération, évaluations
-- -----------------------------------------------------------------------------
-- - Référence unique et séquentielle des colis (« WA-2026-00125 »).
-- - Itinéraire du colis (origine / destination).
-- - Historique des étapes de suivi (`colis_etapes`).
-- - Évaluation liée au colis + tags (puces).
-- - Portefeuille du voyageur (solde).
-- - Signalements.
-- - Messagerie minimale (conversations + messages).
-- Aucune donnée existante n'est supprimée.
-- =============================================================================

-- 1. Référence des colis ------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS colis_reference_seq;

ALTER TABLE colis ADD COLUMN IF NOT EXISTS reference VARCHAR(20);

UPDATE colis
   SET reference = 'WA-' || to_char(created_at, 'YYYY') || '-'
                   || lpad(nextval('colis_reference_seq')::text, 5, '0')
 WHERE reference IS NULL;

ALTER TABLE colis ALTER COLUMN reference SET NOT NULL;
ALTER TABLE colis ALTER COLUMN reference
  SET DEFAULT ('WA-' || to_char(now(), 'YYYY') || '-'
               || lpad(nextval('colis_reference_seq')::text, 5, '0'));

CREATE UNIQUE INDEX IF NOT EXISTS colis_reference_unique ON colis (reference);

-- 2. Itinéraire du colis (complète l'itinéraire du trajet quand il existe) ---
ALTER TABLE colis ADD COLUMN IF NOT EXISTS ville_origine VARCHAR(120);
ALTER TABLE colis ADD COLUMN IF NOT EXISTS ville_destination VARCHAR(120);

-- 3. Historique des étapes de suivi ------------------------------------------
CREATE TABLE IF NOT EXISTS colis_etapes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colis_id    UUID NOT NULL REFERENCES colis (id) ON DELETE CASCADE,
  demande_id  UUID REFERENCES demandes (id) ON DELETE SET NULL,
  etape       VARCHAR(30) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auteur_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT colis_etapes_etape_check CHECK (etape IN (
    'demande_envoyee', 'demande_acceptee', 'remis_voyageur',
    'en_transit', 'arrive_destination', 'remis_destinataire'
  ))
);

-- Une seule occurrence de chaque étape par colis (garantit l'ordre et l'idempotence).
CREATE UNIQUE INDEX IF NOT EXISTS colis_etapes_colis_etape_unique
  ON colis_etapes (colis_id, etape);
CREATE INDEX IF NOT EXISTS colis_etapes_colis_idx
  ON colis_etapes (colis_id, occurred_at);

-- 4. Évaluation liée au colis + tags -----------------------------------------
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS colis_id UUID REFERENCES colis (id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS evaluations_colis_unique
  ON evaluations (colis_id) WHERE colis_id IS NOT NULL;

-- 5. Portefeuille du voyageur ------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_currency VARCHAR(3) NOT NULL DEFAULT 'MUR';

-- 6. Signalements ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signalements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  cible_type VARCHAR(20) NOT NULL,
  cible_id   UUID NOT NULL,
  motif      VARCHAR(60) NOT NULL,
  message    VARCHAR(1000),
  statut     VARCHAR(20) NOT NULL DEFAULT 'ouvert',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT signalements_cible_check CHECK (cible_type IN ('trajet', 'colis')),
  CONSTRAINT signalements_statut_check CHECK (statut IN ('ouvert', 'traite', 'rejete'))
);

CREATE INDEX IF NOT EXISTS signalements_cible_idx ON signalements (cible_type, cible_id);
CREATE INDEX IF NOT EXISTS signalements_auteur_idx ON signalements (auteur_id);

-- 7. Messagerie minimale -----------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_b_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_users_check CHECK (user_a_id <> user_b_id)
);

-- Une seule conversation par paire d'utilisateurs (ordre indifférent).
CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_unique
  ON conversations (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  auteur_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  contenu         VARCHAR(1000) NOT NULL,
  lu              BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at);

DROP TRIGGER IF EXISTS conversations_set_updated_at ON conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- >>> 007_preferences.sql
-- =============================================================================
-- Weight'Aty — Migration 007 : paramètres du compte
-- -----------------------------------------------------------------------------
-- - `language`           : langue de l'interface (i18n non encore en place).
-- - `notif_*`            : préférences de notification (activées par défaut).
-- - `privacy_*`          : préférences de confidentialité.
-- - `tokens_valid_after` : date à partir de laquelle les jetons émis avant sont
--                          refusés (permet d'invalider les autres sessions lors
--                          d'un changement de mot de passe ou d'une suppression).
-- Aucune donnée existante n'est modifiée.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'fr';

ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_messages  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_trajets   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_paiements BOOLEAN NOT NULL DEFAULT true;

-- Par défaut : nom abrégé (« Prénom N. »), photo visible, nombre de voyages visible.
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_full_name    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_show_photo   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_show_trips   BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens_valid_after TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_language_check') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_language_check CHECK (language IN ('fr', 'en'));
  END IF;
END $$;
