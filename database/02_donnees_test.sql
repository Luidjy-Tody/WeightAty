-- Weight’Aty - donnees de demonstration UNIQUEMENT
-- A executer UNE FOIS sur une base de test vide apres 01_creation_weightaty_securisee.sql.
-- Les mots de passe TEST_NO_LOGIN ne permettent PAS de se connecter.
-- Le backend devra generer de vrais hash (Argon2id ou bcrypt) pour des comptes de test.
-- Ne jamais lancer ce fichier sur une base contenant de vraies donnees.
USE weightaty_db;
START TRANSACTION;

INSERT INTO utilisateur (id,prenom,nom,email,mot_de_passe_hash,localisation,description) VALUES
(9001,'Marie','Noel','marie.demo@weightaty.example','TEST_NO_LOGIN','Port-Louis, Maurice','Voyageuse et expeditrice'),
(9002,'Jean','Martin','jean.demo@weightaty.example','TEST_NO_LOGIN','Maurice','Voyageur'),
(9003,'Sarah','Laurent','sarah.demo@weightaty.example','TEST_NO_LOGIN','Paris, France','Voyageuse'),
(9004,'David','Roux','david.demo@weightaty.example','TEST_NO_LOGIN','Lyon, France','Voyageur');

INSERT INTO trajet (id,voyageur_id,depart,destination,date_depart,poids_total,lieu_remise,lieu_recuperation,informations,statut) VALUES
(9101,9002,'Maurice','Paris','2026-11-12 10:00:00',8.00,'Port-Louis','Paris centre','Bagage cabine exclu','publie'),
(9102,9003,'Paris','Montreal','2026-11-18 14:00:00',5.00,'Paris centre','Montreal centre',NULL,'publie'),
(9103,9004,'Lyon','Maurice','2026-11-24 09:00:00',12.00,'Lyon centre','Port-Louis',NULL,'publie'),
(9104,9001,'Maurice','Londres','2026-12-02 08:00:00',6.00,'Quatre Bornes','Londres centre',NULL,'publie'),
(9105,9002,'Maurice','Paris','2026-10-10 08:00:00',10.00,'Port-Louis','Paris centre','Transport de demonstration termine','termine');

INSERT INTO colis (id,expediteur_id,type,description,poids,valeur_declaree,longueur,largeur,hauteur,statut) VALUES
(9201,9001,'Documents','Documents administratifs',0.50,100.00,30,22,2,'brouillon'),
(9202,9001,'Vetements','Vetements emballes',2.00,1500.00,35,25,15,'pret'),
(9203,9001,'Electronique','Accessoires electroniques',1.00,3000.00,20,15,10,'pret'),
(9204,9003,'Vetements','Vetements de voyage',2.50,1800.00,30,25,20,'annule'),
(9205,9004,'Documents','Dossier refuse',0.80,200.00,30,22,3,'pret'),
(9206,9001,'Documents','Documents deja livres',1.20,500.00,32,24,4,'livre');

INSERT INTO photo_colis (id,colis_id,photo_url) VALUES
(9301,9202,'/assets/demo/colis-vetements.jpg');

INSERT INTO demande_transport (id,colis_id,trajet_id,statut,date_demande,date_reponse,date_annulation,motif_refus,motif_annulation) VALUES
(9401,9202,9101,'en_attente','2026-10-19 09:00:00',NULL,NULL,NULL,NULL),
(9402,9203,9102,'acceptee','2026-10-18 09:00:00','2026-10-18 12:00:00',NULL,NULL,NULL),
(9403,9204,9101,'annulee','2026-10-16 09:00:00',NULL,'2026-10-17 10:00:00',NULL,'Changement de programme'),
(9404,9205,9102,'refusee','2026-10-15 09:00:00','2026-10-15 11:00:00',NULL,'Espace insuffisant',NULL),
(9405,9206,9105,'acceptee','2026-10-01 09:00:00','2026-10-02 09:00:00',NULL,NULL,NULL);

INSERT INTO notification (id,utilisateur_id,demande_id,type,message,date_creation,date_lecture) VALUES
(9501,9002,9401,'nouvelle_demande','Nouvelle demande pour Maurice vers Paris','2026-10-19 09:01:00',NULL),
(9502,9001,9402,'demande_acceptee','Votre demande a ete acceptee','2026-10-18 12:01:00','2026-10-18 14:00:00'),
(9503,9004,9404,'demande_refusee','Votre demande a ete refusee','2026-10-15 11:01:00',NULL);

INSERT INTO avis (id,demande_id,auteur_id,destinataire_id,note,commentaire,date_creation) VALUES
(9601,9405,9001,9002,5,'Transport bien realise','2026-10-12 12:00:00');

COMMIT;
-- Note : le schema actuel ne contient pas les dates de prise en charge/livraison.
-- L'avis sur le transport termine est une donnee de demonstration, non une preuve de livraison.
