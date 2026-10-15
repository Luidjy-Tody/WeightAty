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
