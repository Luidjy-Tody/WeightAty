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
