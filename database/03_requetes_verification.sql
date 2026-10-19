-- Weight’Aty - verification sans modification des donnees
USE weightaty_db;
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='weightaty_db' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;
SELECT COUNT(*) AS nombre_tables FROM information_schema.TABLES WHERE TABLE_SCHEMA='weightaty_db' AND TABLE_TYPE='BASE TABLE';
SELECT 'utilisateur' AS table_nom,COUNT(*) AS lignes FROM utilisateur
UNION ALL SELECT 'trajet',COUNT(*) FROM trajet
UNION ALL SELECT 'colis',COUNT(*) FROM colis
UNION ALL SELECT 'photo_colis',COUNT(*) FROM photo_colis
UNION ALL SELECT 'demande_transport',COUNT(*) FROM demande_transport
UNION ALL SELECT 'notification',COUNT(*) FROM notification
UNION ALL SELECT 'avis',COUNT(*) FROM avis
UNION ALL SELECT 'session_utilisateur',COUNT(*) FROM session_utilisateur
UNION ALL SELECT 'reinitialisation_mot_de_passe',COUNT(*) FROM reinitialisation_mot_de_passe;

-- Recherche de trajets : poids restant = total moins demandes acceptees
SELECT t.id,t.depart,t.destination,t.date_depart,t.poids_total,
 t.poids_total-COALESCE(SUM(CASE WHEN d.statut='acceptee' THEN c.poids ELSE 0 END),0) AS poids_restant
FROM trajet t LEFT JOIN demande_transport d ON d.trajet_id=t.id
LEFT JOIN colis c ON c.id=d.colis_id
WHERE t.statut='publie'
GROUP BY t.id,t.depart,t.destination,t.date_depart,t.poids_total
ORDER BY t.date_depart;

-- Demandes avec proprietaires
SELECT d.id AS demande_id,d.statut,c.id AS colis_id,
 CONCAT(e.prenom,' ',e.nom) AS expediteur,
 CONCAT(v.prenom,' ',v.nom) AS voyageur,
 t.depart,t.destination
FROM demande_transport d
JOIN colis c ON c.id=d.colis_id
JOIN utilisateur e ON e.id=c.expediteur_id
JOIN trajet t ON t.id=d.trajet_id
JOIN utilisateur v ON v.id=t.voyageur_id
ORDER BY d.id;

-- Notifications non lues
SELECT utilisateur_id,COUNT(*) AS notifications_non_lues FROM notification
WHERE date_lecture IS NULL GROUP BY utilisateur_id;

-- Note moyenne par utilisateur
SELECT destinataire_id,ROUND(AVG(note),2) AS note_moyenne,COUNT(*) AS nombre_avis
FROM avis GROUP BY destinataire_id;

-- Controles : chaque resultat ci-dessous doit etre vide
SELECT d.id AS demande_sur_son_propre_trajet FROM demande_transport d
JOIN colis c ON c.id=d.colis_id JOIN trajet t ON t.id=d.trajet_id
WHERE c.expediteur_id=t.voyageur_id;
SELECT trajet_id,SUM(c.poids) AS poids_accepte,MAX(t.poids_total) AS poids_total
FROM demande_transport d JOIN colis c ON c.id=d.colis_id
JOIN trajet t ON t.id=d.trajet_id WHERE d.statut='acceptee'
GROUP BY trajet_id HAVING SUM(c.poids)>MAX(t.poids_total);
SELECT colis_id,COUNT(*) AS demandes_acceptees FROM demande_transport
WHERE statut='acceptee' GROUP BY colis_id HAVING COUNT(*)>1;
