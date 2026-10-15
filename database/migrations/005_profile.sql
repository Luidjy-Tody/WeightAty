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
