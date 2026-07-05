-- =====================================================================
-- Migration : ajout de la file d'attente SMS
-- À exécuter APRÈS schema.sql et seed.sql
-- =====================================================================
USE hemolink;

CREATE TABLE IF NOT EXISTS notifications_sms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alerte_id INT NOT NULL,
  donneur_id INT NOT NULL,
  telephone VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  operateur ENUM('orange','free','expresso','autre') DEFAULT 'orange',
  statut ENUM('en_file','envoye','echec','annule') DEFAULT 'en_file',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_envoi DATETIME NULL,
  date_echec DATETIME NULL,
  motif_echec VARCHAR(255),
  FOREIGN KEY (alerte_id) REFERENCES alertes(id) ON DELETE CASCADE,
  FOREIGN KEY (donneur_id) REFERENCES donneurs(id) ON DELETE CASCADE,
  INDEX idx_sms_statut (statut),
  INDEX idx_sms_date (date_creation)
);
