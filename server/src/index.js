import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import donneursRouter from './routes/donneurs.js';
import hopitauxRouter from './routes/hopitaux.js';
import alertesRouter from './routes/alertes.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// ---------- Sécurité ----------
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (origins.includes(origin) || origins.includes('*')) return cb(null, true);
    cb(new Error(`CORS refusé : ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Rate limit léger sur l'auth (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rate limit sur l'IA (coût Groq)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);

// ---------- Health ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'HemoLink API', version: '2.0.0' });
});

// ---------- Routes ----------
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/donneurs', donneursRouter);
app.use('/api/hopitaux', hopitauxRouter);
app.use('/api/alertes', alertesRouter);
app.use('/api/ai', aiRouter);

// ---------- Error handler ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`HemoLink API v2.0 écoute sur http://localhost:${PORT}`);
  console.log(`CORS autorisé pour : ${origins.join(', ')}`);
});
