-- Si la table donneurs existe sans la colonne en_attente_validation :
USE hemolink;
ALTER TABLE donneurs ADD COLUMN en_attente_validation BOOLEAN DEFAULT FALSE AFTER disponible;
