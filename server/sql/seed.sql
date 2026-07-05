-- =====================================================================
-- HemoLink — Données de démonstration (seed)
-- Hôpitaux et centres de transfusion réels du Sénégal
-- =====================================================================
USE hemolink;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_log;
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
