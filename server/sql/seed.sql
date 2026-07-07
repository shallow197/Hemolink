-- =====================================================================
-- HemoLink — Données de démonstration (seed)
-- Hôpitaux et centres de transfusion réels du Sénégal
-- =====================================================================
USE hemolink;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
TRUNCATE TABLE notifications;
TRUNCATE TABLE notifications_sms;
TRUNCATE TABLE historique_dons;
TRUNCATE TABLE reponses_alertes;
TRUNCATE TABLE alertes;
TRUNCATE TABLE stocks_sang;
TRUNCATE TABLE donneurs;
TRUNCATE TABLE users;
TRUNCATE TABLE hopitaux;
TRUNCATE TABLE regions;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------
-- Régions du Sénégal (14 régions administratives)
-- ----------------------------------------------------------------------
INSERT INTO regions (id, nom, latitude, longitude) VALUES
 (1,  'Dakar',       14.69280000, -17.44670000),
 (2,  'Thiès',       14.78860000, -16.92600000),
 (3,  'Diourbel',    14.65580000, -16.23030000),
 (4,  'Fatick',      14.33900000, -16.41100000),
 (5,  'Kaolack',     14.16520000, -16.07260000),
 (6,  'Kaffrine',    14.10590000, -15.55060000),
 (7,  'Louga',       15.61400000, -16.22050000),
 (8,  'Saint-Louis', 16.01790000, -16.48960000),
 (9,  'Matam',       15.65590000, -13.25540000),
 (10, 'Tambacounda', 13.77070000, -13.66730000),
 (11, 'Kédougou',    12.55560000, -12.18420000),
 (12, 'Kolda',       12.88330000, -14.95000000),
 (13, 'Sédhiou',     12.70830000, -15.55670000),
 (14, 'Ziguinchor',  12.56830000, -16.27190000);

-- ----------------------------------------------------------------------
-- Hôpitaux et centres de transfusion (données réelles)
-- ----------------------------------------------------------------------
INSERT INTO hopitaux (id, nom, type, region_id, ville, adresse, telephone, email, latitude, longitude, service_transfusion) VALUES
 (1,  'Centre National de Transfusion Sanguine (CNTS)', 'cnts',   1, 'Dakar',       'Avenue Cheikh Anta Diop, Fann',                  '+221338690807', 'contact@cnts.sn',           14.69380000, -17.46380000, TRUE),
 (2,  'CHNU Aristide Le Dantec',                        'chu',    1, 'Dakar',       'Avenue Pasteur, Plateau',                        '+221338890000', 'contact@hald.sn',           14.66880000, -17.43330000, TRUE),
 (3,  'CHNU de Fann',                                   'chu',    1, 'Dakar',       'Avenue Cheikh Anta Diop, Fann',                  '+221338690000', 'contact@chufann.sn',        14.69060000, -17.46580000, TRUE),
 (4,  'Hôpital Principal de Dakar',                     'epn',    1, 'Dakar',       '1 Avenue Nelson Mandela',                        '+221338394050', 'contact@hpd.sn',            14.66660000, -17.42760000, TRUE),
 (5,  'Hôpital Général Idrissa Pouye (HOGIP / Grand Yoff)','epn',  1, 'Dakar',       'Route du Front de Terre, Grand Yoff',            '+221338594040', 'contact@hogip.sn',          14.74700000, -17.46490000, TRUE),
 (6,  'Hôpital Dalal Jamm',                             'epn',    1, 'Guédiawaye',  'Cité Mixta, Guédiawaye',                         '+221338541414', 'contact@daljamm.sn',        14.78090000, -17.39080000, TRUE),
 (7,  'Hôpital Roi Baudouin',                           'epn',    1, 'Guédiawaye',  'Guédiawaye',                                     '+221338371717', 'contact@roibaudouin.sn',    14.77310000, -17.40330000, TRUE),
 (8,  'Hôpital Militaire de Ouakam',                    'epn',    1, 'Dakar',       'Ouakam',                                         '+221338201111', 'contact@hmo.sn',            14.72180000, -17.49070000, TRUE),
 (9,  'Hôpital Abass Ndao',                             'epn',    1, 'Dakar',       'Rue 7 x Boulevard Général de Gaulle',            '+221338232525', 'contact@abassndao.sn',      14.67860000, -17.43890000, TRUE),
 (10, 'Hôpital pour Enfants Albert Royer',              'epn',    1, 'Dakar',       'Fann',                                           '+221338690200', 'contact@albertroyer.sn',    14.69200000, -17.46580000, TRUE),
 (11, 'CHR Amadou Sakhir Mbaye de Louga',               'epn',    7, 'Louga',       'Avenue Cheikh Anta Diop',                        '+221339671000', 'contact@chrlouga.sn',       15.61500000, -16.22500000, TRUE),
 (12, 'CHR de Saint-Louis',                             'epn',    8, 'Saint-Louis', 'Sor',                                            '+221339611500', 'contact@chrsl.sn',          16.02780000, -16.48560000, TRUE),
 (13, 'CHR de Thiès',                                   'epn',    2, 'Thiès',       'Cité Ballabey',                                  '+221339512345', 'contact@chrthies.sn',       14.78820000, -16.91560000, TRUE),
 (14, 'EPS Hôpital El Hadji Ibrahima Niass',            'epn',    5, 'Kaolack',     'Kaolack',                                        '+221339411000', 'contact@hopitalkaolack.sn', 14.15170000, -16.07200000, TRUE),
 (15, 'CHR de Ziguinchor',                              'epn',   14, 'Ziguinchor',  'Avenue Jean-Paul II',                            '+221339911234', 'contact@chrzig.sn',         12.56860000, -16.27100000, TRUE);

-- ----------------------------------------------------------------------
-- Utilisateurs de démonstration
-- Mot de passe par défaut pour TOUS : "Hemolink2026!"
-- Hash bcrypt à 10 rounds (généré séparément)
-- ----------------------------------------------------------------------
-- bcrypt hash pour "Hemolink2026!" = $2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK
-- (Ce hash est régénéré par scripts/seed-users.js si tu préfères, voir README)
INSERT INTO users (id, email, password_hash, role, hopital_id, actif, email_verifie) VALUES
 (1, 'admin@hemolink.sn',       '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'admin',   NULL, TRUE, TRUE),
 (2, 'cnts@hemolink.sn',        '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'cnts',    1,    TRUE, TRUE),
 (3, 'fann@hemolink.sn',        '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'hopital', 3,    TRUE, TRUE),
 (4, 'principal@hemolink.sn',   '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'hopital', 4,    TRUE, TRUE),
 (5, 'daljamm@hemolink.sn',     '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'hopital', 6,    TRUE, TRUE),
 (6, 'aminata@example.sn',      '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'donneur', NULL, TRUE, TRUE),
 (7, 'cheikh@example.sn',       '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'donneur', NULL, TRUE, TRUE),
 (8, 'fatou@example.sn',        '$2b$10$wH8YBpD0WdNzPqQ9YK4OcOvJ.Ho2c8h4tD4kHs2c5J9k4D9Q0u2gK', 'donneur', NULL, TRUE, TRUE);

-- ----------------------------------------------------------------------
-- Donneurs (répartis géographiquement à Dakar + régions)
-- Coordonnées GPS = quartiers réels
-- ----------------------------------------------------------------------
INSERT INTO donneurs
 (id, user_id, nom, prenom, telephone, email, date_naissance, sexe, groupe_sanguin, poids_kg, region_id, ville, quartier, latitude, longitude, disponible, en_attente_validation, derniere_date_don, nombre_dons, consentement_rgpd)
VALUES
 (1,  6,    'Diop',     'Aminata',   '+221771112233', 'aminata@example.sn', '1995-03-12','femme','O-',  62.0, 1, 'Dakar',      'Mermoz',          14.71550000, -17.47570000, TRUE, FALSE, '2026-02-10', 4, TRUE),
 (2,  7,    'Ndiaye',   'Cheikh',    '+221772223344', 'cheikh@example.sn',  '1990-07-22','homme','A+',  78.0, 1, 'Dakar',      'Sacré-Cœur',      14.71850000, -17.46100000, TRUE, FALSE, '2026-01-15', 6, TRUE),
 (3,  8,    'Fall',     'Fatou',     '+221773334455', 'fatou@example.sn',   '1998-11-30','femme','B+',  58.0, 1, 'Dakar',      'Yoff',            14.74970000, -17.49050000, TRUE, FALSE, '2025-12-20', 3, TRUE),
 (4,  NULL, 'Sarr',     'Mamadou',   '+221774445566', NULL,                 '1985-05-15','homme','O+',  82.0, 1, 'Dakar',      'Médina',          14.68160000, -17.45330000, TRUE, FALSE, '2026-01-05', 8, TRUE),
 (5,  NULL, 'Sow',      'Aïssatou',  '+221775556677', NULL,                 '1993-09-08','femme','AB+', 55.0, 1, 'Dakar',      'Point E',         14.69000000, -17.46390000, TRUE, FALSE, '2025-11-12', 2, TRUE),
 (6,  NULL, 'Ba',       'Ibrahima',  '+221776667788', NULL,                 '1988-02-18','homme','A-',  75.0, 1, 'Dakar',      'Almadies',        14.74320000, -17.51720000, TRUE, FALSE, '2025-10-08', 5, TRUE),
 (7,  NULL, 'Sy',       'Khady',     '+221777778899', NULL,                 '2000-04-25','femme','O+',  60.0, 1, 'Dakar',      'Parcelles Assainies', 14.77110000, -17.42100000, TRUE, FALSE, NULL, 0, TRUE),
 (8,  NULL, 'Camara',   'Modou',     '+221778889900', NULL,                 '1992-12-03','homme','B-',  80.0, 1, 'Pikine',     'Thiaroye',        14.76660000, -17.36100000, TRUE, FALSE, '2025-09-22', 3, TRUE),
 (9,  NULL, 'Gueye',    'Awa',       '+221779990011', NULL,                 '1996-08-14','femme','O-',  57.0, 1, 'Guédiawaye', 'Cité Mixta',      14.77990000, -17.39250000, TRUE, FALSE, '2025-08-30', 4, TRUE),
 (10, NULL, 'Mbaye',    'Ousmane',   '+221770001122', NULL,                 '1987-06-21','homme','A+',  77.0, 1, 'Dakar',      'Hann',            14.71280000, -17.42810000, TRUE, FALSE, '2026-02-15', 7, TRUE),
 (11, NULL, 'Diallo',   'Mariama',   '+221701112233', NULL,                 '1994-10-05','femme','AB-', 56.0, 1, 'Dakar',      'Liberté 6',       14.72540000, -17.45920000, TRUE, FALSE, '2025-07-18', 2, TRUE),
 (12, NULL, 'Sene',     'Pape',      '+221702223344', NULL,                 '1991-01-28','homme','O+',  85.0, 1, 'Rufisque',   'Rufisque Centre', 14.71750000, -17.27260000, TRUE, FALSE, '2025-12-01', 6, TRUE),
 (13, NULL, 'Cissé',    'Astou',     '+221703334455', NULL,                 '1999-03-17','femme','B+',  53.0, 1, 'Dakar',      'Ouakam',          14.72440000, -17.49640000, TRUE, FALSE, NULL, 0, TRUE),
 (14, NULL, 'Diouf',    'Saliou',    '+221704445566', NULL,                 '1989-11-09','homme','A-',  79.0, 1, 'Dakar',      'Liberté 5',       14.72000000, -17.45100000, FALSE, FALSE, '2026-03-15', 5, TRUE),
 (15, NULL, 'Faye',     'Mame',      '+221705556677', NULL,                 '1997-07-04','femme','O+',  61.0, 1, 'Dakar',      'HLM',             14.71400000, -17.45550000, TRUE, FALSE, '2025-11-25', 3, TRUE),
 (16, NULL, 'Niang',    'Babacar',   '+221706667788', NULL,                 '1986-04-22','homme','AB+', 88.0, 2, 'Thiès',      'Thiès Nord',      14.79110000, -16.91950000, TRUE, FALSE, '2025-10-12', 4, TRUE),
 (17, NULL, 'Sall',     'Bineta',    '+221707778899', NULL,                 '1992-09-30','femme','O-',  59.0, 1, 'Dakar',      'Fann Hock',       14.68660000, -17.46190000, TRUE, FALSE, '2025-12-30', 2, TRUE),
 (18, NULL, 'Wade',     'Alioune',   '+221708889900', NULL,                 '1990-05-11','homme','B+',  76.0, 1, 'Dakar',      'Plateau',         14.66780000, -17.42330000, TRUE, FALSE, '2026-02-20', 5, TRUE),
 (19, NULL, 'Lo',       'Coumba',    '+221709990011', NULL,                 '1995-12-19','femme','A+',  54.0, 1, 'Dakar',      'Sicap Liberté',   14.71060000, -17.46410000, TRUE, FALSE, '2025-09-05', 3, TRUE),
 (20, NULL, 'Tine',     'Moussa',    '+221780001122', NULL,                 '1984-08-07','homme','O+',  83.0, 8, 'Saint-Louis','Sor',             16.02670000, -16.48590000, TRUE, FALSE, '2025-11-30', 9, TRUE),
 (21, NULL, 'Diagne',   'Rama',      '+221781112233', NULL,                 '1998-02-14','femme','AB+', 56.0, 1, 'Dakar',      'Dieuppeul',       14.71960000, -17.45110000, TRUE, FALSE, NULL, 0, TRUE),
 (22, NULL, 'Thiam',    'Lamine',    '+221782223344', NULL,                 '1988-10-26','homme','A-',  74.0, 1, 'Dakar',      'Sicap Baobab',    14.71390000, -17.46150000, TRUE, FALSE, '2025-08-18', 4, TRUE),
 (23, NULL, 'Ndiaye',   'Fatoumata', '+221783334455', NULL,                 '1996-06-09','femme','O+',  58.0, 1, 'Pikine',     'Guinaw Rails',    14.74790000, -17.38420000, TRUE, FALSE, '2025-12-15', 2, TRUE),
 (24, NULL, 'Kane',     'Daouda',    '+221784445566', NULL,                 '1991-03-25','homme','B-',  81.0, 1, 'Dakar',      'Cambérène',       14.76190000, -17.43960000, TRUE, FALSE, '2025-10-22', 3, TRUE),
 (25, NULL, 'Diatta',   'Ngoné',     '+221785556677', NULL,                 '1993-11-13','femme','O-',  60.0, 14,'Ziguinchor', 'Centre',          12.56970000, -16.27130000, TRUE, FALSE, '2025-11-08', 5, TRUE),
 (26, NULL, 'Coulibaly','Mamadou',   '+221786667788', NULL,                 '1989-07-16','homme','A+',  77.0, 1, 'Dakar',      'Yoff Layène',     14.75240000, -17.49860000, TRUE, FALSE, '2026-01-20', 6, TRUE),
 (27, NULL, 'Touré',    'Aïda',      '+221787778899', NULL,                 '1997-04-08','femme','AB-', 55.0, 1, 'Dakar',      'Sotrac Mermoz',   14.72120000, -17.47950000, TRUE, FALSE, NULL, 0, TRUE),
 (28, NULL, 'Diawara',  'Souleymane','+221788889900', NULL,                 '1985-09-21','homme','O+',  86.0, 5, 'Kaolack',    'Kaolack Centre',  14.15780000, -16.07090000, TRUE, FALSE, '2025-09-12', 7, TRUE),
 (29, NULL, 'Mbow',     'Khadidiatou','+221789990011',NULL,                 '1994-12-30','femme','B+',  57.0, 1, 'Dakar',      'Ngor',            14.75330000, -17.51410000, TRUE, FALSE, '2026-02-05', 3, TRUE),
 (30, NULL, 'Diack',    'Abdoulaye', '+221761112233', NULL,                 '1990-02-17','homme','A+',  79.0, 1, 'Dakar',      'Cité Keur Gorgui', 14.72390000, -17.47330000, TRUE, FALSE, '2025-10-30', 4, TRUE);

-- ----------------------------------------------------------------------
-- Stocks de sang par hôpital (pour les 7 principaux établissements)
-- ----------------------------------------------------------------------
-- CNTS : stocks centraux importants
INSERT INTO stocks_sang (hopital_id, groupe_sanguin, quantite_poches, seuil_critique) VALUES
 (1, 'O+', 42, 10), (1, 'O-', 8,  6),  (1, 'A+', 35, 8),  (1, 'A-', 6,  5),
 (1, 'B+', 22, 7),  (1, 'B-', 5,  5),  (1, 'AB+',12, 4),  (1, 'AB-', 3, 3),

 (2, 'O+', 18, 8),  (2, 'O-', 3,  5),  (2, 'A+', 12, 6),  (2, 'A-', 2,  4),
 (2, 'B+', 8,  5),  (2, 'B-', 1,  3),  (2, 'AB+', 4, 3),  (2, 'AB-', 1, 2),

 (3, 'O+', 24, 8),  (3, 'O-', 6,  5),  (3, 'A+', 16, 6),  (3, 'A-', 4,  4),
 (3, 'B+', 10, 5),  (3, 'B-', 3,  3),  (3, 'AB+', 6, 3),  (3, 'AB-', 2, 2),

 (4, 'O+', 28, 8),  (4, 'O-', 7,  5),  (4, 'A+', 20, 6),  (4, 'A-', 5,  4),
 (4, 'B+', 14, 5),  (4, 'B-', 4,  3),  (4, 'AB+', 8, 3),  (4, 'AB-', 2, 2),

 (5, 'O+', 9,  8),  (5, 'O-', 2,  5),  (5, 'A+', 7,  6),  (5, 'A-', 1,  4),
 (5, 'B+', 5,  5),  (5, 'B-', 2,  3),  (5, 'AB+', 3, 3),  (5, 'AB-', 0, 2),

 (6, 'O+', 14, 8),  (6, 'O-', 4,  5),  (6, 'A+', 10, 6),  (6, 'A-', 3,  4),
 (6, 'B+', 6,  5),  (6, 'B-', 1,  3),  (6, 'AB+', 4, 3),  (6, 'AB-', 1, 2),

 (8, 'O+', 16, 8),  (8, 'O-', 5,  5),  (8, 'A+', 11, 6),  (8, 'A-', 2,  4),
 (8, 'B+', 7,  5),  (8, 'B-', 2,  3),  (8, 'AB+', 5, 3),  (8, 'AB-', 1, 2);

-- ----------------------------------------------------------------------
-- Alertes de démonstration (1 en cours critique, 1 résolue)
-- ----------------------------------------------------------------------
INSERT INTO alertes (id, hopital_id, cree_par_user_id, groupe_sanguin, niveau_urgence, message, rayon_km, poches_necessaires, statut, donneurs_contactes, donneurs_repondus, donneurs_acceptes, date_creation) VALUES
 (1, 3, 3, 'O-', 'critique', 'Patient en césarienne d''urgence, besoin de 3 poches O- immédiatement.', 25, 3, 'en_cours', 4, 2, 1, NOW() - INTERVAL 35 MINUTE),
 (2, 4, 4, 'B-', 'urgent',   'Stock B- bientôt épuisé, prévision opération vasculaire demain matin.',   30, 2, 'resolue',  3, 3, 2, NOW() - INTERVAL 3 DAY);

UPDATE alertes SET date_resolution = NOW() - INTERVAL 2 DAY WHERE id = 2;

-- Réponses pour l'alerte #1 (O- critique)
INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, distance_km, date_notification, date_reponse) VALUES
 (1, 1,  'accepte',     2.4,  NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 20 MINUTE),
 (1, 9,  'pas_repondu', 11.8, NOW() - INTERVAL 35 MINUTE, NULL),
 (1, 17, 'refuse',      1.9,  NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 28 MINUTE),
 (1, 25, 'pas_repondu', 480.0, NOW() - INTERVAL 35 MINUTE, NULL);

-- Réponses pour l'alerte #2 (B- résolue)
INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, distance_km, date_notification, date_reponse) VALUES
 (2, 8,  'accepte', 5.2, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 1 HOUR),
 (2, 24, 'accepte', 8.6, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 2 HOUR),
 (2, 11, 'refuse',  4.3, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 30 MINUTE);

-- ----------------------------------------------------------------------
-- Historique de dons (pour démontrer la traçabilité)
-- ----------------------------------------------------------------------
INSERT INTO historique_dons (donneur_id, hopital_id, alerte_id, date_don, groupe_sanguin, poches_prelevees, type_prelevement, apte) VALUES
 (1, 1, NULL, '2026-02-10', 'O-', 1, 'sang_total', TRUE),
 (2, 1, NULL, '2026-01-15', 'A+', 1, 'sang_total', TRUE),
 (4, 1, NULL, '2026-01-05', 'O+', 1, 'sang_total', TRUE),
 (8, 4, 2,    '2025-09-22', 'B-', 1, 'sang_total', TRUE),
 (10,1, NULL, '2026-02-15', 'A+', 1, 'sang_total', TRUE),
 (18,1, NULL, '2026-02-20', 'B+', 1, 'sang_total', TRUE),
 (26,3, NULL, '2026-01-20', 'A+', 1, 'sang_total', TRUE),
 (29,1, NULL, '2026-02-05', 'B+', 1, 'sang_total', TRUE);

-- =====================================================================
-- ENRICHISSEMENT PÔLE 4 — Jeux d'essais complets
-- =====================================================================

-- ----------------------------------------------------------------------
-- Donneurs supplémentaires (31-42) : couverture régionale élargie +
-- 4 profils EN ATTENTE DE VALIDATION (pour la démo CNTS du Pôle 5)
-- ----------------------------------------------------------------------
INSERT INTO donneurs
 (id, user_id, nom, prenom, telephone, email, date_naissance, sexe, groupe_sanguin, poids_kg, region_id, ville, quartier, latitude, longitude, disponible, en_attente_validation, derniere_date_don, nombre_dons, consentement_rgpd)
VALUES
 (31, NULL, 'Badji',    'Yacine',    '+221762223344', NULL, '1993-05-19','femme','O+',  63.0, 14,'Ziguinchor', 'Boucotte',        12.57450000, -16.27800000, TRUE,  FALSE, '2025-12-05', 3, TRUE),
 (32, NULL, 'Mané',     'Landing',   '+221763334455', NULL, '1987-08-02','homme','B+',  84.0, 12,'Kolda',      'Sikilo',          12.89390000, -14.94170000, TRUE,  FALSE, '2025-10-15', 5, TRUE),
 (33, NULL, 'Barry',    'Hawa',      '+221764445566', NULL, '1999-01-27','femme','A+',  55.0, 10,'Tambacounda','Pont',            13.77410000, -13.66810000, TRUE,  FALSE, NULL,          0, TRUE),
 (34, NULL, 'Konaté',   'Sékou',     '+221765556677', NULL, '1991-06-14','homme','O-',  76.0, 5, 'Kaolack',    'Médina Baye',     14.16100000, -16.06590000, TRUE,  FALSE, '2026-01-25', 4, TRUE),
 (35, NULL, 'Dieng',    'Sophie',    '+221766667788', NULL, '1996-09-23','femme','AB+', 58.0, 2, 'Thiès',      'Grand Standing',  14.79470000, -16.93080000, TRUE,  FALSE, '2025-11-18', 2, TRUE),
 (36, NULL, 'Ka',       'Oumar',     '+221767778899', NULL, '1983-12-11','homme','B-',  87.0, 7, 'Louga',      'Artillerie',      15.61890000, -16.24480000, TRUE,  FALSE, '2025-08-25', 6, TRUE),
 (37, NULL, 'Ndour',    'Adja',      '+221768889900', NULL, '1994-04-06','femme','A-',  57.0, 8, 'Saint-Louis','Ndar Toute',      16.03350000, -16.50210000, TRUE,  FALSE, '2026-02-28', 3, TRUE),
 (38, NULL, 'Sagna',    'Boubacar',  '+221769990011', NULL, '1990-10-31','homme','O+',  80.0, 4, 'Fatick',     'Escale',          14.33540000, -16.41230000, FALSE, FALSE, '2026-04-02', 4, TRUE),
 -- 4 donneurs en attente de validation CNTS (badge "en_attente")
 (39, NULL, 'Goudiaby', 'Aissatou',  '+221751112233', NULL, '2001-03-08','femme','O+',  59.0, 1, 'Dakar',      'Grand Dakar',     14.71050000, -17.44700000, TRUE,  TRUE,  NULL, 0, TRUE),
 (40, NULL, 'Seydi',    'Malick',    '+221752223344', NULL, '1998-07-20','homme','A+',  72.0, 1, 'Pikine',     'Dalifort',        14.75630000, -17.40260000, TRUE,  TRUE,  NULL, 0, TRUE),
 (41, NULL, 'Boye',     'Ndeye Fatou','+221753334455',NULL, '2000-11-15','femme','B+',  54.0, 2, 'Thiès',      'Mbour 1',         14.78550000, -16.92920000, TRUE,  TRUE,  NULL, 0, TRUE),
 (42, NULL, 'Diedhiou', 'Ansou',     '+221754445566', NULL, '1995-02-09','homme','O-',  78.0, 14,'Ziguinchor', 'Lyndiane',        12.56230000, -16.26480000, TRUE,  TRUE,  NULL, 0, TRUE);

-- ----------------------------------------------------------------------
-- Stocks pour les hôpitaux qui n'en avaient pas (7, 9 à 15)
-- → chaque hôpital a désormais ses 8 lignes de stock
-- ----------------------------------------------------------------------
INSERT INTO stocks_sang (hopital_id, groupe_sanguin, quantite_poches, seuil_critique) VALUES
 (7,  'O+', 11, 8), (7,  'O-', 2, 5), (7,  'A+', 8,  6), (7,  'A-', 1, 4),
 (7,  'B+', 5,  5), (7,  'B-', 1, 3), (7,  'AB+', 2, 3), (7,  'AB-', 0, 2),
 (9,  'O+', 13, 8), (9,  'O-', 3, 5), (9,  'A+', 9,  6), (9,  'A-', 2, 4),
 (9,  'B+', 6,  5), (9,  'B-', 2, 3), (9,  'AB+', 3, 3), (9,  'AB-', 1, 2),
 (10, 'O+', 10, 8), (10, 'O-', 4, 5), (10, 'A+', 7,  6), (10, 'A-', 2, 4),
 (10, 'B+', 5,  5), (10, 'B-', 1, 3), (10, 'AB+', 2, 3), (10, 'AB-', 1, 2),
 (11, 'O+', 7,  8), (11, 'O-', 1, 5), (11, 'A+', 5,  6), (11, 'A-', 1, 4),
 (11, 'B+', 4,  5), (11, 'B-', 0, 3), (11, 'AB+', 1, 3), (11, 'AB-', 0, 2),
 (12, 'O+', 9,  8), (12, 'O-', 2, 5), (12, 'A+', 6,  6), (12, 'A-', 1, 4),
 (12, 'B+', 4,  5), (12, 'B-', 1, 3), (12, 'AB+', 2, 3), (12, 'AB-', 0, 2),
 (13, 'O+', 12, 8), (13, 'O-', 3, 5), (13, 'A+', 8,  6), (13, 'A-', 2, 4),
 (13, 'B+', 6,  5), (13, 'B-', 1, 3), (13, 'AB+', 3, 3), (13, 'AB-', 1, 2),
 (14, 'O+', 8,  8), (14, 'O-', 1, 5), (14, 'A+', 5,  6), (14, 'A-', 1, 4),
 (14, 'B+', 3,  5), (14, 'B-', 0, 3), (14, 'AB+', 1, 3), (14, 'AB-', 0, 2),
 (15, 'O+', 6,  8), (15, 'O-', 1, 5), (15, 'A+', 4,  6), (15, 'A-', 0, 4),
 (15, 'B+', 3,  5), (15, 'B-', 1, 3), (15, 'AB+', 1, 3), (15, 'AB-', 0, 2);

-- ----------------------------------------------------------------------
-- Alertes supplémentaires : tous les statuts sont représentés
-- ----------------------------------------------------------------------
INSERT INTO alertes (id, hopital_id, cree_par_user_id, groupe_sanguin, niveau_urgence, message, rayon_km, poches_necessaires, statut, donneurs_contactes, donneurs_repondus, donneurs_acceptes, date_creation) VALUES
 (3, 6, 5, 'A+', 'urgent',   'Besoin de 2 poches A+ pour un patient drépanocytaire hospitalisé.',       20, 2, 'en_cours', 5, 1, 1, NOW() - INTERVAL 5 HOUR),
 (4, 4, 4, 'O+', 'normal',   'Campagne de renouvellement du stock O+ avant le week-end.',               40, 5, 'expiree',  8, 2, 1, NOW() - INTERVAL 10 DAY),
 (5, 1, 2, 'AB-','critique', 'Urgence polytraumatisé — AB- introuvable, tous donneurs bienvenus.',      50, 2, 'annulee',  2, 0, 0, NOW() - INTERVAL 6 DAY),
 (6, 13,2, 'O-', 'urgent',   'CHR Thiès : accident de la route, 2 poches O- nécessaires.',              30, 2, 'resolue',  3, 3, 2, NOW() - INTERVAL 15 DAY);

UPDATE alertes SET date_expiration = NOW() - INTERVAL 3 DAY  WHERE id = 4;
UPDATE alertes SET date_resolution = NOW() - INTERVAL 14 DAY WHERE id = 6;

-- Réponses pour les nouvelles alertes
INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, distance_km, date_notification, date_reponse) VALUES
 (3, 2,  'accepte',     6.1,  NOW() - INTERVAL 5 HOUR,  NOW() - INTERVAL 4 HOUR),
 (3, 10, 'pas_repondu', 5.8,  NOW() - INTERVAL 5 HOUR,  NULL),
 (3, 19, 'pas_repondu', 7.2,  NOW() - INTERVAL 5 HOUR,  NULL),
 (3, 26, 'pas_repondu', 9.4,  NOW() - INTERVAL 5 HOUR,  NULL),
 (3, 30, 'pas_repondu', 8.0,  NOW() - INTERVAL 5 HOUR,  NULL),
 (4, 4,  'accepte',     3.1,  NOW() - INTERVAL 10 DAY,  NOW() - INTERVAL 9 DAY),
 (4, 7,  'refuse',      10.2, NOW() - INTERVAL 10 DAY,  NOW() - INTERVAL 9 DAY),
 (4, 12, 'pas_repondu', 18.5, NOW() - INTERVAL 10 DAY,  NULL),
 (5, 11, 'pas_repondu', 4.7,  NOW() - INTERVAL 6 DAY,   NULL),
 (5, 27, 'pas_repondu', 2.3,  NOW() - INTERVAL 6 DAY,   NULL),
 (6, 16, 'accepte',     4.9,  NOW() - INTERVAL 15 DAY,  NOW() - INTERVAL 15 DAY + INTERVAL 45 MINUTE),
 (6, 35, 'accepte',     1.2,  NOW() - INTERVAL 15 DAY,  NOW() - INTERVAL 15 DAY + INTERVAL 2 HOUR),
 (6, 41, 'refuse',      0.8,  NOW() - INTERVAL 15 DAY,  NOW() - INTERVAL 15 DAY + INTERVAL 1 HOUR);

-- Dons supplémentaires (dont 1 inaptitude pour tester ce cas)
INSERT INTO historique_dons (donneur_id, hopital_id, alerte_id, date_don, groupe_sanguin, poches_prelevees, type_prelevement, apte, motif_inaptitude) VALUES
 (16, 13, 6,   '2026-06-22', 'AB+', 1, 'sang_total', TRUE,  NULL),
 (34, 14, NULL,'2026-01-25', 'O-',  1, 'sang_total', TRUE,  NULL),
 (37, 12, NULL,'2026-02-28', 'A-',  1, 'plasma',     TRUE,  NULL),
 (20, 12, NULL,'2025-11-30', 'O+',  2, 'sang_total', TRUE,  NULL),
 (14, 3,  NULL,'2026-03-15', 'A-',  1, 'sang_total', TRUE,  NULL),
 (22, 3,  NULL,'2025-08-18', 'A-',  1, 'plaquettes', TRUE,  NULL),
 (38, 1,  NULL,'2026-04-02', 'O+',  0, 'sang_total', FALSE, 'Tension artérielle trop basse le jour du don');

-- ----------------------------------------------------------------------
-- Notifications : TOUS les types représentés (page Notifications Pôle 5)
-- ----------------------------------------------------------------------
INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id, lu, date_creation) VALUES
 -- Donneur 1 (Aminata, compte aminata@example.sn) : parcours complet
 (NULL, 1, 'alerte_urgente',     'Alerte critique — sang O- recherché',      'CHNU de Fann (Dakar) a besoin de 3 poches O- immédiatement.',                    '/mon-espace/alertes',    1, 0, NOW() - INTERVAL 35 MINUTE),
 (NULL, 1, 'don_reussi',         'Merci pour votre don ! 🩸',                 'Votre don de 1 poche (sang total) au CNTS a bien été enregistré.',               '/mon-espace/historique', NULL, 1, NOW() - INTERVAL 4 MONTH),
 (NULL, 1, 'rappel_eligibilite', 'Vous êtes de nouveau éligible',            'Votre délai inter-dons est écoulé : vous pouvez de nouveau donner votre sang.',  '/mon-espace',            NULL, 0, NOW() - INTERVAL 2 DAY),
 -- Donneur 2 (Cheikh) : alerte en cours + don passé
 (NULL, 2, 'alerte_urgente',     'Alerte urgente — sang A+ recherché',       'Hôpital Dalal Jamm (Guédiawaye) a besoin de 2 poches A+.',                       '/mon-espace/alertes',    3, 1, NOW() - INTERVAL 5 HOUR),
 (NULL, 2, 'don_reussi',         'Merci pour votre don ! 🩸',                 'Votre don de 1 poche (sang total) au CNTS a bien été enregistré.',               '/mon-espace/historique', NULL, 1, NOW() - INTERVAL 5 MONTH),
 -- Donneur 3 (Fatou) : rappel + info
 (NULL, 3, 'rappel_eligibilite', 'Vous êtes de nouveau éligible',            'Cela fait plus de 4 mois depuis votre dernier don. Un geste peut sauver 3 vies.','/mon-espace',            NULL, 0, NOW() - INTERVAL 1 DAY),
 (NULL, 3, 'info',               'Journée mondiale du donneur — 14 juin',    'Rejoignez la collecte spéciale organisée au CNTS de Fann.',                      NULL,                     NULL, 1, NOW() - INTERVAL 23 DAY),
 -- Donneurs récemment validés / en attente
 (NULL, 7, 'validation_profil',  'Profil validé par le CNTS',                'Votre profil donneur a été validé. Vous recevrez désormais les alertes compatibles.', '/mon-espace',       NULL, 0, NOW() - INTERVAL 3 DAY),
 (NULL, 21,'validation_profil',  'Profil validé par le CNTS',                'Votre profil donneur a été validé. Bienvenue dans la communauté HemoLink !',     '/mon-espace',            NULL, 1, NOW() - INTERVAL 8 DAY),
 -- Staff Hôpital Principal (user 4) : alerte résolue (alerte 2 = la sienne)
 (4, NULL, 'alerte_resolue',     'Alerte B- résolue',                        'Objectif atteint : 2 donneurs ont accepté pour 2 poches demandées.',             '/staff/alertes/2',       2, 1, NOW() - INTERVAL 2 DAY),
 -- Staff hôpital Fann (user 3) : stock critique
 (3, NULL, 'stock_critique',     'Stock B- critique',                        'CHNU de Fann : il reste 3 poches de B- (seuil : 3). Pensez à lancer une alerte.','/staff/stocks',          NULL, 0, NOW() - INTERVAL 6 HOUR),
 -- Staff Hôpital Principal (user 4) : stock critique
 (4, NULL, 'stock_critique',     'Stock AB- critique',                       'Hôpital Principal : il reste 2 poches de AB- (seuil : 2).',                      '/staff/stocks',          NULL, 0, NOW() - INTERVAL 1 DAY),
 -- CNTS (user 2) : info générale
 (2, NULL, 'info',               '4 donneurs en attente de validation',      'De nouveaux profils donneurs attendent votre validation.',                       '/staff/donneurs',        NULL, 0, NOW() - INTERVAL 12 HOUR);

-- ----------------------------------------------------------------------
-- File SMS de démonstration (2 envoyés, 1 en file, 1 échec)
-- ----------------------------------------------------------------------
INSERT INTO notifications_sms (alerte_id, donneur_id, telephone, message, operateur, statut, date_creation, date_envoi, date_echec, motif_echec) VALUES
 (1, 1,  '+221771112233', 'ALERTE HemoLink CRITIQUE — Sang O- demandé a CHNU de Fann. Repondez sur hemolink.sn/a/1.', 'orange',   'envoye',  NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 33 MINUTE, NULL, NULL),
 (1, 9,  '+221779990011', 'ALERTE HemoLink CRITIQUE — Sang O- demandé a CHNU de Fann. Repondez sur hemolink.sn/a/1.', 'free',     'envoye',  NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 32 MINUTE, NULL, NULL),
 (3, 10, '+221770001122', 'ALERTE HemoLink URGENT — Sang A+ demandé a Hopital Dalal Jamm. Repondez sur hemolink.sn/a/3.', 'orange','en_file', NOW() - INTERVAL 5 HOUR,   NULL, NULL, NULL),
 (3, 19, '+221709990011', 'ALERTE HemoLink URGENT — Sang A+ demandé a Hopital Dalal Jamm. Repondez sur hemolink.sn/a/3.', 'expresso','echec', NOW() - INTERVAL 5 HOUR,   NULL, NOW() - INTERVAL 4 HOUR, 'Numéro injoignable');

-- ----------------------------------------------------------------------
-- Journal d'audit de démonstration
-- ----------------------------------------------------------------------
INSERT INTO audit_log (user_id, action, cible, cible_id, details, ip, date_action) VALUES
 (3, 'login',                NULL,        NULL, NULL,                                        '127.0.0.1', NOW() - INTERVAL 1 DAY),
 (3, 'create_alerte',        'alertes',   1,    '{"groupe_sanguin":"O-","niveau_urgence":"critique"}', '127.0.0.1', NOW() - INTERVAL 35 MINUTE),
 (2, 'valider_donneur',      'donneurs',  21,   NULL,                                        '127.0.0.1', NOW() - INTERVAL 8 DAY),
 (4, 'update_stock',         'stocks_sang', 4,  '{"groupe":"O+","quantite_poches":28}',      '127.0.0.1', NOW() - INTERVAL 2 DAY),
 (6, 'repondre_alerte',      'alertes',   1,    '{"reponse":"accepte"}',                     '127.0.0.1', NOW() - INTERVAL 20 MINUTE);
