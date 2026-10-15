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
