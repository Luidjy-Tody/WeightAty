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
