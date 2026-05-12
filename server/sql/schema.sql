-- =====================================================================
-- HemoLink — Schéma de base de données
-- Système de coordination des dons de sang d'urgence au Sénégal
-- Compatible MySQL 8 / MariaDB 10.4+ (WAMP)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hemolink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hemolink;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS historique_dons;
DROP TABLE IF EXISTS reponses_alertes;
DROP TABLE IF EXISTS alertes;
DROP TABLE IF EXISTS stocks_sang;
DROP TABLE IF EXISTS donneurs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS hopitaux;
DROP TABLE IF EXISTS regions;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------
-- Régions du Sénégal (référence géographique)
-- ----------------------------------------------------------------------
CREATE TABLE regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(80) NOT NULL UNIQUE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL
);

-- ----------------------------------------------------------------------
-- Hôpitaux (établissements de santé partenaires)
-- ----------------------------------------------------------------------
CREATE TABLE hopitaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(180) NOT NULL,
  type ENUM('chu','epn','clinique','centre_sante','cnts') DEFAULT 'epn',
  region_id INT NULL,
  ville VARCHAR(100) NOT NULL,
  adresse VARCHAR(255),
  telephone VARCHAR(30),
  email VARCHAR(180),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  service_transfusion BOOLEAN DEFAULT TRUE,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  INDEX idx_hop_region (region_id),
  INDEX idx_hop_ville (ville)
);

-- ----------------------------------------------------------------------
-- Utilisateurs (comptes connectables : donneurs, staff hôpital, CNTS)
-- ----------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('donneur','hopital','cnts','admin') NOT NULL,
  hopital_id INT NULL,
  actif BOOLEAN DEFAULT TRUE,
  email_verifie BOOLEAN DEFAULT FALSE,
  derniere_connexion DATETIME NULL,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hopital_id) REFERENCES hopitaux(id) ON DELETE SET NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_hopital (hopital_id)
);

-- ----------------------------------------------------------------------
-- Donneurs (profils donneurs liés ou non à un compte user)
-- ----------------------------------------------------------------------
CREATE TABLE donneurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL UNIQUE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(30) NOT NULL,
  email VARCHAR(180),
  date_naissance DATE,
  sexe ENUM('homme','femme','autre') DEFAULT 'autre',
  groupe_sanguin ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  poids_kg DECIMAL(5,2) NULL,
  region_id INT NULL,
  ville VARCHAR(100) NOT NULL,
  quartier VARCHAR(120),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  disponible BOOLEAN DEFAULT TRUE,
  en_attente_validation BOOLEAN DEFAULT TRUE,
  derniere_date_don DATE NULL,
  nombre_dons INT DEFAULT 0,
  consentement_rgpd BOOLEAN DEFAULT FALSE,
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL,
  INDEX idx_donneurs_gs (groupe_sanguin),
  INDEX idx_donneurs_dispo (disponible, en_attente_validation),
  INDEX idx_donneurs_geo (latitude, longitude),
  INDEX idx_donneurs_ville (ville)
);

-- ----------------------------------------------------------------------
-- Stocks de sang par hôpital et par groupe sanguin
-- ----------------------------------------------------------------------
CREATE TABLE stocks_sang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hopital_id INT NOT NULL,
  groupe_sanguin ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  quantite_poches INT DEFAULT 0,
  seuil_critique INT DEFAULT 5,
  date_maj DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hopital_id) REFERENCES hopitaux(id) ON DELETE CASCADE,
  UNIQUE KEY uk_stock_hopital_gs (hopital_id, groupe_sanguin)
);

-- ----------------------------------------------------------------------
-- Alertes (campagnes de recrutement de donneurs)
-- ----------------------------------------------------------------------
CREATE TABLE alertes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hopital_id INT NOT NULL,
  cree_par_user_id INT NULL,
  groupe_sanguin ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  niveau_urgence ENUM('critique','urgent','normal') NOT NULL,
  message TEXT,
  rayon_km INT NOT NULL DEFAULT 25,
  poches_necessaires INT DEFAULT 1,
  statut ENUM('en_cours','resolue','expiree','annulee') DEFAULT 'en_cours',
  donneurs_contactes INT DEFAULT 0,
  donneurs_repondus INT DEFAULT 0,
  donneurs_acceptes INT DEFAULT 0,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_resolution DATETIME NULL,
  date_expiration DATETIME NULL,
  FOREIGN KEY (hopital_id) REFERENCES hopitaux(id) ON DELETE CASCADE,
  FOREIGN KEY (cree_par_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_alertes_statut (statut),
  INDEX idx_alertes_date (date_creation)
);

-- ----------------------------------------------------------------------
-- Réponses des donneurs aux alertes (notifications)
-- ----------------------------------------------------------------------
CREATE TABLE reponses_alertes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alerte_id INT NOT NULL,
  donneur_id INT NOT NULL,
  reponse ENUM('accepte','refuse','pas_repondu') DEFAULT 'pas_repondu',
  distance_km DECIMAL(6,2) NULL,
  date_notification DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_reponse DATETIME NULL,
  date_lecture DATETIME NULL,
  message_donneur TEXT,
  FOREIGN KEY (alerte_id) REFERENCES alertes(id) ON DELETE CASCADE,
  FOREIGN KEY (donneur_id) REFERENCES donneurs(id) ON DELETE CASCADE,
  UNIQUE KEY uk_alerte_donneur (alerte_id, donneur_id),
  INDEX idx_resp_donneur (donneur_id, reponse)
);

-- ----------------------------------------------------------------------
-- Historique des dons effectifs (traçabilité médicale)
-- ----------------------------------------------------------------------
CREATE TABLE historique_dons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donneur_id INT NOT NULL,
  hopital_id INT NOT NULL,
  alerte_id INT NULL,
  date_don DATE NOT NULL,
  groupe_sanguin ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  poches_prelevees INT DEFAULT 1,
  type_prelevement ENUM('sang_total','plaquettes','plasma') DEFAULT 'sang_total',
  apte BOOLEAN DEFAULT TRUE,
  motif_inaptitude VARCHAR(255),
  FOREIGN KEY (donneur_id) REFERENCES donneurs(id) ON DELETE CASCADE,
  FOREIGN KEY (hopital_id) REFERENCES hopitaux(id) ON DELETE CASCADE,
  FOREIGN KEY (alerte_id) REFERENCES alertes(id) ON DELETE SET NULL,
  INDEX idx_hist_donneur (donneur_id, date_don)
);

-- ----------------------------------------------------------------------
-- Journal d'audit (traçabilité actions sensibles — exigence CNTS)
-- ----------------------------------------------------------------------
CREATE TABLE audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(80) NOT NULL,
  cible VARCHAR(80),
  cible_id INT,
  details TEXT,
  ip VARCHAR(45),
  date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_date (date_action)
);
