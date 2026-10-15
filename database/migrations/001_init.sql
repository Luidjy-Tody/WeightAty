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
