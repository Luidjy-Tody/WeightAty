-- Weight’Aty - installation non destructive de la structure
-- MySQL 8.0.16+ (CHECK applique). Nom officiel : weightaty_db
-- Aucun DROP, TRUNCATE ou suppression de donnees.
-- CREATE TABLE IF NOT EXISTS ne met PAS a jour une table existante.
-- Si une table existe avec une autre structure, verifier manuellement avant toute migration.
CREATE DATABASE IF NOT EXISTS `weightaty_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `weightaty_db`;

-- TABLE utilisateur
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localisation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `statut` enum('actif','suspendu') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE trajet
CREATE TABLE IF NOT EXISTS `trajet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `voyageur_id` int NOT NULL,
  `depart` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_depart` datetime NOT NULL,
  `poids_total` decimal(8,2) NOT NULL,
  `lieu_remise` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lieu_recuperation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `informations` text COLLATE utf8mb4_unicode_ci,
  `statut` enum('publie','annule','termine') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publie',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_trajet_voyageur` (`voyageur_id`),
  CONSTRAINT `fk_trajet_voyageur` FOREIGN KEY (`voyageur_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_trajet_destination` CHECK ((`depart` <> `destination`)),
  CONSTRAINT `chk_trajet_poids` CHECK ((`poids_total` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE colis
CREATE TABLE IF NOT EXISTS `colis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediteur_id` int NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `poids` decimal(8,2) NOT NULL,
  `valeur_declaree` decimal(12,2) DEFAULT '0.00',
  `longueur` decimal(8,2) NOT NULL,
  `largeur` decimal(8,2) NOT NULL,
  `hauteur` decimal(8,2) NOT NULL,
  `statut` enum('brouillon','pret','pris_en_charge','livre','annule') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'brouillon',
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_colis_expediteur` (`expediteur_id`),
  CONSTRAINT `fk_colis_expediteur` FOREIGN KEY (`expediteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_colis_hauteur` CHECK ((`hauteur` > 0)),
  CONSTRAINT `chk_colis_largeur` CHECK ((`largeur` > 0)),
  CONSTRAINT `chk_colis_longueur` CHECK ((`longueur` > 0)),
  CONSTRAINT `chk_colis_poids` CHECK ((`poids` > 0)),
  CONSTRAINT `chk_colis_valeur` CHECK ((`valeur_declaree` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE photo_colis
CREATE TABLE IF NOT EXISTS `photo_colis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `colis_id` int NOT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_photo_colis` (`colis_id`),
  CONSTRAINT `fk_photo_colis` FOREIGN KEY (`colis_id`) REFERENCES `colis` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE demande_transport
CREATE TABLE IF NOT EXISTS `demande_transport` (
  `id` int NOT NULL AUTO_INCREMENT,
  `colis_id` int NOT NULL,
  `trajet_id` int NOT NULL,
  `statut` enum('en_attente','acceptee','refusee','annulee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `date_demande` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_reponse` datetime DEFAULT NULL,
  `date_annulation` datetime DEFAULT NULL,
  `motif_refus` text COLLATE utf8mb4_unicode_ci,
  `motif_annulation` text COLLATE utf8mb4_unicode_ci,
  `date_modification` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_demande_colis_trajet` (`colis_id`,`trajet_id`),
  KEY `fk_demande_trajet` (`trajet_id`),
  CONSTRAINT `fk_demande_colis` FOREIGN KEY (`colis_id`) REFERENCES `colis` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_demande_trajet` FOREIGN KEY (`trajet_id`) REFERENCES `trajet` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `demande_id` int DEFAULT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_lecture` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notification_utilisateur` (`utilisateur_id`),
  KEY `fk_notification_demande` (`demande_id`),
  CONSTRAINT `fk_notification_demande` FOREIGN KEY (`demande_id`) REFERENCES `demande_transport` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE avis
CREATE TABLE IF NOT EXISTS `avis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demande_id` int NOT NULL,
  `auteur_id` int NOT NULL,
  `destinataire_id` int NOT NULL,
  `note` tinyint NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_avis_demande_auteur` (`demande_id`,`auteur_id`),
  KEY `fk_avis_auteur` (`auteur_id`),
  KEY `fk_avis_destinataire` (`destinataire_id`),
  CONSTRAINT `fk_avis_auteur` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_avis_demande` FOREIGN KEY (`demande_id`) REFERENCES `demande_transport` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_avis_destinataire` FOREIGN KEY (`destinataire_id`) REFERENCES `utilisateur` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_avis_note` CHECK ((`note` between 1 and 5)),
  CONSTRAINT `chk_avis_utilisateurs` CHECK ((`auteur_id` <> `destinataire_id`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE session_utilisateur
CREATE TABLE IF NOT EXISTS `session_utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `empreinte_jeton` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_expiration` datetime NOT NULL,
  `date_revocation` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empreinte_jeton` (`empreinte_jeton`),
  KEY `fk_session_utilisateur` (`utilisateur_id`),
  CONSTRAINT `fk_session_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE reinitialisation_mot_de_passe
CREATE TABLE IF NOT EXISTS `reinitialisation_mot_de_passe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `empreinte_jeton` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_expiration` datetime NOT NULL,
  `date_utilisation` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empreinte_jeton` (`empreinte_jeton`),
  KEY `fk_reinitialisation_utilisateur` (`utilisateur_id`),
  CONSTRAINT `fk_reinitialisation_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
