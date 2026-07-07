-- =====================================================================
-- Migration : table notifications (Pôle 4 → prérequis Pôle 5)
-- À exécuter APRÈS schema.sql (si la base existe déjà sans cette table).
-- Sinon, schema.sql à jour la crée directement.
-- =====================================================================
-- Une notification = un message adressé à UN destinataire :
--   • donneur_id renseigné → notification pour un donneur
--   • user_id renseigné    → notification pour un compte staff (hopital/cnts/admin)
-- Le champ `type` couvre les besoins de la page "Notifications" du Pôle 5 :
--   alerte_urgente / don_reussi / rappel_eligibilite / validation_profil /
--   alerte_resolue / stock_critique / info
-- =====================================================================
USE hemolink;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  donneur_id INT NULL,
  type ENUM('alerte_urgente','don_reussi','rappel_eligibilite','validation_profil','alerte_resolue','stock_critique','info') NOT NULL DEFAULT 'info',
  titre VARCHAR(180) NOT NULL,
  message TEXT,
  lien VARCHAR(255) NULL,
  alerte_id INT NULL,
  lu BOOLEAN DEFAULT FALSE,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_lecture DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (donneur_id) REFERENCES donneurs(id) ON DELETE CASCADE,
  FOREIGN KEY (alerte_id) REFERENCES alertes(id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id, lu),
  INDEX idx_notif_donneur (donneur_id, lu),
  INDEX idx_notif_date (date_creation)
);
