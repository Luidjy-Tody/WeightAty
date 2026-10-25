USE weightaty_db;
-- Livraison en 2 temps : le voyageur déclare la livraison, l'expéditeur confirme la réception.
-- date_livraison_declaree = déclaration du voyageur ; date_livraison = confirmation de l'expéditeur.
-- Les livraisons déjà confirmées sont considérées comme déclarées. Script rejouable sans erreur.
SET @colonne := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'suivi_transport' AND COLUMN_NAME = 'date_livraison_declaree');
SET @requete := IF(@colonne = 0, 'ALTER TABLE suivi_transport ADD COLUMN date_livraison_declaree DATETIME NULL', 'SELECT 1');
PREPARE etape FROM @requete;
EXECUTE etape;
DEALLOCATE PREPARE etape;
UPDATE suivi_transport SET date_livraison_declaree = date_livraison WHERE date_livraison IS NOT NULL AND date_livraison_declaree IS NULL;
