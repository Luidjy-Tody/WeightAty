USE weightaty_db;
-- Validation du paiement par le voyageur : statut, référence et motif de refus.
-- Les paiements déjà enregistrés sont considérés comme validés. Script rejouable sans erreur.
SET @colonne := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'paiement' AND COLUMN_NAME = 'statut');
SET @requete := IF(@colonne = 0, 'ALTER TABLE paiement ADD COLUMN statut ENUM(''en_attente'',''valide'',''refuse'') NOT NULL DEFAULT ''valide'', ADD COLUMN reference VARCHAR(100) NULL, ADD COLUMN date_validation DATETIME NULL, ADD COLUMN motif_refus VARCHAR(500) NULL', 'SELECT 1');
PREPARE etape FROM @requete;
EXECUTE etape;
DEALLOCATE PREPARE etape;
