// =====================================================================
// auth.js — Routes d'authentification (inscription, connexion, profil)
// =====================================================================
// 4 endpoints publics :
//   POST /api/auth/register/donneur  → inscription d'un donneur
//   POST /api/auth/login             → connexion (renvoie un JWT)
//   GET  /api/auth/me                → profil de l'utilisateur connecté
//   POST /api/auth/logout            → déconnexion (trace dans audit_log)
// =====================================================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';      // hashing sécurisé des mots de passe
import jwt from 'jsonwebtoken';     // génération de JWT
import { z } from 'zod';            // validation des entrées
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEXES = ['homme', 'femme', 'autre'];

// =====================================================================
// BLOC 1 — Schémas de validation Zod
// =====================================================================
// Si le client envoie des données invalides, Zod renvoie un 400 avant
// même qu'on touche à la base. Indispensable contre les attaques par
// injection ou les bugs de typage.
const registerDonneurSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().min(7),
  date_naissance: z.string().optional().nullable(),
  sexe: z.enum(SEXES).optional().default('autre'),
  groupe_sanguin: z.enum(GROUPES),
  poids_kg: z.number().positive().optional().nullable(),
  ville: z.string().min(1),
  quartier: z.string().optional().nullable(),
  region_id: z.number().int().positive().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  consentement_rgpd: z.boolean(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// =====================================================================
// BLOC 2 — Helpers (génération JWT + sérialisation profil)
// =====================================================================

/**
 * Génère un JWT signé pour un utilisateur.
 * Le token contient l'id, l'email, le rôle et éventuellement l'hopital_id
 * (utile pour vérifier rapidement les permissions sans re-toucher la DB).
 * Durée de vie : 12h par défaut.
 */
function signToken(user) {
  const secret = process.env.JWT_SECRET || 'hemolink-dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      hopital_id: user.hopital_id ?? null,
    },
    secret,
    { expiresIn }
  );
}

/**
 * Construit l'objet "profil" qu'on renvoie au client.
 * Selon le rôle, on enrichit avec les infos liées :
 *   - donneur → ajoute l'objet donneur (groupe sanguin, ville, etc.)
 *   - hopital/cnts → ajoute l'objet hopital
 * Important : on ne renvoie JAMAIS le password_hash.
 */
async function userProfile(user) {
  const out = {
    id: user.id,
    email: user.email,
    role: user.role,
    hopital_id: user.hopital_id ?? null,
    actif: !!user.actif,
  };
  if (user.role === 'donneur') {
    const [[d]] = await pool.query('SELECT * FROM donneurs WHERE user_id = ?', [user.id]);
    out.donneur = d || null;
  }
  if ((user.role === 'hopital' || user.role === 'cnts') && user.hopital_id) {
    const [[h]] = await pool.query('SELECT * FROM hopitaux WHERE id = ?', [user.hopital_id]);
    out.hopital = h || null;
  }
  return out;
}

// =====================================================================
// BLOC 3 — Inscription d'un donneur
// =====================================================================
// POST /api/auth/register/donneur
// Crée un user + un donneur dans une transaction (tout ou rien).
// Le compte est créé "en attente de validation" : seul le CNTS peut le
// valider (cf. /api/donneurs/:id/valider).
router.post('/register/donneur', validate(registerDonneurSchema), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const body = req.body;

    // Garde-fou RGPD : aucune création sans consentement explicite
    if (!body.consentement_rgpd) {
      return res.status(400).json({ error: 'Le consentement RGPD est obligatoire.' });
    }

    // Vérifie l'unicité de l'email
    const [exists] = await conn.query('SELECT id FROM users WHERE email = ?', [body.email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    // Hash bcrypt du mot de passe (10 rounds = ~100ms, suffisant pour 2026)
    const password_hash = await bcrypt.hash(body.password, 10);

    // Transaction : si l'INSERT donneurs échoue, on annule l'INSERT users
    await conn.beginTransaction();

    const [userIns] = await conn.query(
      `INSERT INTO users (email, password_hash, role, actif, email_verifie)
       VALUES (?, ?, 'donneur', TRUE, FALSE)`,
      [body.email, password_hash]
    );
    const userId = userIns.insertId;

    const [donneurIns] = await conn.query(
      `INSERT INTO donneurs
       (user_id, nom, prenom, telephone, email, date_naissance, sexe, groupe_sanguin, poids_kg,
        region_id, ville, quartier, latitude, longitude, disponible, en_attente_validation, consentement_rgpd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?)`,
      [
        userId, body.nom, body.prenom, body.telephone, body.email,
        body.date_naissance || null, body.sexe || 'autre', body.groupe_sanguin,
        body.poids_kg ?? null, body.region_id ?? null, body.ville, body.quartier ?? null,
        body.latitude ?? null, body.longitude ?? null,
        body.consentement_rgpd ? 1 : 0,
      ]
    );

    await conn.commit();

    // On renvoie immédiatement un token (auto-login après inscription)
    const [[user]] = await conn.query('SELECT * FROM users WHERE id = ?', [userId]);
    const token = signToken(user);
    const profile = await userProfile(user);

    await audit(req, 'register_donneur', 'donneurs', donneurIns.insertId, { email: body.email });

    res.status(201).json({ token, user: profile });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  } finally {
    conn.release();
  }
});

// =====================================================================
// BLOC 4 — Connexion
// =====================================================================
// POST /api/auth/login
// 3 vérifications : utilisateur existe, compte actif, mot de passe correct.
// En cas d'échec on renvoie le MÊME message d'erreur pour ne pas révéler
// si l'email existe (évite les attaques d'énumération).
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (!user.actif) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez le CNTS.' });
    }

    // Compare le mot de passe entré au hash stocké (bcrypt fait le sel automatiquement)
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Trace la date de dernière connexion
    await pool.query('UPDATE users SET derniere_connexion = NOW() WHERE id = ?', [user.id]);

    const token = signToken(user);
    const profile = await userProfile(user);

    await audit(req, 'login', 'users', user.id);

    res.json({ token, user: profile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// =====================================================================
// BLOC 5 — Récupération du profil courant
// =====================================================================
// GET /api/auth/me
// Le frontend appelle ce endpoint au démarrage pour savoir qui est connecté.
// Si le JWT en localStorage est encore valide → renvoie le profil.
// Sinon → 401 et le front redirige vers /login.
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const profile = await userProfile(user);
    res.json({ user: profile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur profil' });
  }
});

// =====================================================================
// BLOC 6 — Déconnexion (côté serveur = trace dans audit_log)
// =====================================================================
// POST /api/auth/logout
// Avec JWT, "déconnecter" côté serveur n'a pas vraiment de sens (le token
// reste valide jusqu'à expiration). On se contente de tracer l'événement.
// C'est le client qui supprime le token de son localStorage.
router.post('/logout', requireAuth({ optional: true }), async (req, res) => {
  if (req.user) {
    await audit(req, 'logout', 'users', req.user.id);
  }
  res.json({ ok: true });
});

export default router;

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (25 secondes) :
// ---------------------------------------------------------------------
// On gère l'auth avec 3 briques standards :
//   • bcrypt pour HASHER les mots de passe (jamais en clair en base)
//   • JWT pour générer un jeton de session signé que le client garde
//   • Zod pour valider toutes les entrées avant la moindre opération
// L'inscription d'un donneur crée 2 lignes (users + donneurs) dans UNE
// transaction MySQL : si la 2ème échoue, on annule la 1ère. Le compte
// est créé "en attente de validation CNTS" — c'est la procédure terrain
// décrite lors de notre visite. Chaque login/logout est tracé dans
// audit_log pour conformité.
// =====================================================================
