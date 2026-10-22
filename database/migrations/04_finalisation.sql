USE weightaty_db;
-- Verrou commun aux mutations métier : ordre déterministe, adapté au projet étudiant.
CREATE TABLE IF NOT EXISTS verrou_application (id INT PRIMARY KEY) ENGINE=InnoDB;
INSERT IGNORE INTO verrou_application VALUES (1);
CREATE TABLE IF NOT EXISTS administrateur (
 utilisateur_id INT PRIMARY KEY, FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS brouillon_trajet (
 colis_id INT PRIMARY KEY, trajet_id INT NOT NULL,
 FOREIGN KEY (colis_id) REFERENCES colis(id) ON DELETE CASCADE,
 FOREIGN KEY (trajet_id) REFERENCES trajet(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS paiement (
 id INT AUTO_INCREMENT PRIMARY KEY, demande_id INT NOT NULL UNIQUE,
 transport DECIMAL(12,2) NOT NULL, frais DECIMAL(12,2) NOT NULL,
 devise CHAR(3) NOT NULL DEFAULT 'MUR', mode VARCHAR(20) NOT NULL DEFAULT 'simulation',
 date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (demande_id) REFERENCES demande_transport(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS suivi_transport (
 demande_id INT PRIMARY KEY, date_prise_en_charge DATETIME NULL, date_livraison DATETIME NULL,
 FOREIGN KEY (demande_id) REFERENCES demande_transport(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS message (
 id INT AUTO_INCREMENT PRIMARY KEY, demande_id INT NOT NULL, auteur_id INT NOT NULL,
 contenu TEXT NOT NULL, date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (demande_id) REFERENCES demande_transport(id) ON DELETE RESTRICT,
 FOREIGN KEY (auteur_id) REFERENCES utilisateur(id) ON DELETE RESTRICT,
 INDEX ix_message_demande(demande_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS signalement (
 id INT AUTO_INCREMENT PRIMARY KEY, auteur_id INT NOT NULL, demande_id INT NOT NULL,
 motif TEXT NOT NULL, statut ENUM('ouvert','resolu') NOT NULL DEFAULT 'ouvert',
 date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (auteur_id) REFERENCES utilisateur(id) ON DELETE RESTRICT,
 FOREIGN KEY (demande_id) REFERENCES demande_transport(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS tentative_connexion (
 cle CHAR(64) PRIMARY KEY, essais INT NOT NULL DEFAULT 0, debut DATETIME NOT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS journal_action (
 id INT AUTO_INCREMENT PRIMARY KEY, acteur_id INT NOT NULL, action VARCHAR(100) NOT NULL,
 cible_id INT NULL, date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (acteur_id) REFERENCES utilisateur(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sessions_actives (
 empreinte CHAR(64) PRIMARY KEY, utilisateur_id INT NOT NULL,
 FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
) ENGINE=InnoDB;
-- Les remboursements sont eux aussi uniquement simulés.
CREATE TABLE IF NOT EXISTS remboursement (
 paiement_id INT PRIMARY KEY, date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (paiement_id) REFERENCES paiement(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
