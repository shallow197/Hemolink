// =====================================================================
// index.js — Point d'entrée du serveur HemoLink API
// =====================================================================
// Ce fichier monte le serveur Express, branche la sécurité (helmet, CORS,
// rate-limit), expose les routes /api/* et démarre l'écoute HTTP.
// =====================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';                  // headers HTTP de sécurité
import rateLimit from 'express-rate-limit';   // limite le nombre de requêtes par IP
import dotenv from 'dotenv';

// --- Import de tous les routeurs métier --------------------------------
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import donneursRouter from './routes/donneurs.js';
import hopitauxRouter from './routes/hopitaux.js';
import alertesRouter from './routes/alertes.js';
import aiRouter from './routes/ai.js';
import smsRouter from './routes/sms.js';
import exportsRouter from './routes/exports.js';

dotenv.config(); // charge les variables d'environnement depuis server/.env

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// =====================================================================
// BLOC 1 — Sécurité HTTP (helmet + CORS)
// =====================================================================
// trust proxy = on est OK derrière un reverse proxy (nécessaire pour
// que express-rate-limit voie la vraie IP du client).
app.set('trust proxy', 1);

// Helmet ajoute une douzaine de headers de sécurité (X-Frame-Options,
// X-Content-Type-Options, etc.). On désactive CSP en dev car Vite injecte
// des scripts inline.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS : on autorise uniquement les origines listées dans .env
// (par défaut : Vite dev sur 5173 et Next.js sur 3000)
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);                       // requêtes serveur-à-serveur OK
    if (origins.includes(origin) || origins.includes('*')) return cb(null, true);
    cb(new Error(`CORS refusé : ${origin}`));
  },
  credentials: true,
}));

// Parsing du corps JSON (limite 1 MB pour éviter les payloads abusifs)
app.use(express.json({ limit: '1mb' }));

// =====================================================================
// BLOC 2 — Rate limiting (anti brute-force et anti-abus IA)
// =====================================================================
// /api/auth/login & /register : max 50 tentatives par IP toutes les 15 min
// → empêche un attaquant de tester des mots de passe en masse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// /api/ai : max 20 requêtes par IP par minute
// → l'API Groq est facturée, on évite qu'un utilisateur consomme tout le quota
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);

// =====================================================================
// BLOC 3 — Endpoint de santé (healthcheck)
// =====================================================================
// Utile pour vérifier que l'API tourne (monitoring, scripts de démarrage,
// page de statut). Renvoie 200 + JSON simple.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'HemoLink API', version: '2.0.0' });
});

// =====================================================================
// BLOC 4 — Montage des routeurs métier
// =====================================================================
app.use('/api/auth', authRouter);          // login, register, me, logout
app.use('/api/dashboard', dashboardRouter); // KPIs, carte, vue CNTS
app.use('/api/donneurs', donneursRouter);   // CRUD donneurs + /me + validation
app.use('/api/hopitaux', hopitauxRouter);   // hôpitaux + stocks + création d'alerte
app.use('/api/alertes', alertesRouter);     // historique, détail, accept/refuse, statut
app.use('/api/ai', aiRouter);               // assistant IA Groq
app.use('/api/sms', smsRouter);             // file SMS (simulation Sonatel/Orange)
app.use('/api/exports', exportsRouter);     // CSV CNTS + certificat de don

// =====================================================================
// BLOC 5 — Gestionnaire d'erreur global (filet de sécurité)
// =====================================================================
// Express appelle ce middleware si n'importe quelle route remonte une
// erreur. On distingue les erreurs CORS (403) des autres (500).
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Erreur serveur' });
});

// =====================================================================
// BLOC 6 — Démarrage du serveur HTTP
// =====================================================================
app.listen(PORT, () => {
  console.log(`HemoLink API v2.0 écoute sur http://localhost:${PORT}`);
  console.log(`CORS autorisé pour : ${origins.join(', ')}`);
});

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// C'est le point de départ du backend. À chaque démarrage on configure :
//   1. La sécurité (helmet pour les headers, CORS pour autoriser le front)
//   2. Le rate-limiting (anti brute-force sur /auth, anti-abus sur /ai)
//   3. Les routeurs métier (auth, donneurs, hopitaux, alertes, dashboard, ai)
//   4. Un gestionnaire d'erreur global qui transforme tout crash en JSON propre
// Quand on fait "npm run dev", node redémarre automatiquement à chaque
// modification (--watch). En production, on utiliserait PM2 ou systemd.
// =====================================================================
