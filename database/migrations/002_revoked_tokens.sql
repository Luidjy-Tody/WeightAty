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
