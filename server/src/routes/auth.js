import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEXES = ['homme', 'femme', 'autre'];

// ---------------------------------------------------------------
// Schémas Zod
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// POST /api/auth/register/donneur
// ---------------------------------------------------------------
router.post('/register/donneur', validate(registerDonneurSchema), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const body = req.body;
    if (!body.consentement_rgpd) {
      return res.status(400).json({ error: 'Le consentement RGPD est obligatoire.' });
    }

    const [exists] = await conn.query('SELECT id FROM users WHERE email = ?', [body.email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    const password_hash = await bcrypt.hash(body.password, 10);

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
        userId,
        body.nom,
        body.prenom,
        body.telephone,
        body.email,
        body.date_naissance || null,
        body.sexe || 'autre',
        body.groupe_sanguin,
        body.poids_kg ?? null,
        body.region_id ?? null,
        body.ville,
        body.quartier ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.consentement_rgpd ? 1 : 0,
      ]
    );

    await conn.commit();

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

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
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

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

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

// ---------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// POST /api/auth/logout (côté serveur : trace uniquement)
// ---------------------------------------------------------------
router.post('/logout', requireAuth({ optional: true }), async (req, res) => {
  if (req.user) {
    await audit(req, 'logout', 'users', req.user.id);
  }
  res.json({ ok: true });
});

export default router;
