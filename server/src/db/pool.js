// =====================================================================
// pool.js — Pool de connexions MySQL
// =====================================================================
// Une connexion MySQL coûte cher à ouvrir/fermer. Avec un POOL on garde
// 10 connexions ouvertes en permanence : chaque requête en emprunte une,
// l'utilise, la rend. Beaucoup plus rapide qu'une connexion par requête.
// =====================================================================

import mysql from 'mysql2/promise'; // version avec promesses (async/await)
import dotenv from 'dotenv';

dotenv.config();

// --- Création du pool partagé par tout le serveur ---
// Les routes importent simplement `pool` et font `pool.query(sql, params)`.
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE || 'hemolink',
  waitForConnections: true, // si toutes occupées, on attend au lieu d'erreur
  connectionLimit: 10,      // max 10 connexions simultanées
});

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// On utilise mysql2 (avec son support natif des Promises) et on crée UN
// pool de connexions partagé. Toutes les routes importent ce pool. Les
// paramètres viennent du fichier .env (jamais en dur dans le code) :
// adresse, port, utilisateur, mot de passe, nom de la base. C'est
// l'unique point de contact entre HemoLink et la base MySQL (sur WAMP).
// =====================================================================
