// =====================================================================
// ai.js — Assistant IA HemoLink (chat conversationnel sur les données)
// =====================================================================
// Pipeline en 4 étapes pour répondre à une question utilisateur :
//   1. On envoie la question à Groq (Llama 3.3 70B) avec le schéma de DB
//   2. L'IA renvoie soit du texte direct, soit un bloc ```sql ... ```
//   3. Si SQL : on valide avec sqlGuard, on exécute, on récupère les rows
//   4. On RE-DEMANDE à l'IA de transformer les rows en français naturel
//      (sans JSON, sans crochets, sans jargon technique)
// L'utilisateur ne voit jamais le SQL ni les données brutes.
// =====================================================================

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateReadOnlySql } from '../utils/sqlGuard.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { calculerPrevisions, resumerPrevisions } from '../utils/previsions.js';
import { genererNotificationsAuto } from '../utils/autoNotifs.js';

const router = Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SCHEMA = `
Tables MySQL (hemolink) :
- regions(id, nom, latitude, longitude)
- hopitaux(id, nom, type, region_id, ville, adresse, telephone, email, latitude, longitude, service_transfusion)
- users(id, email, role[donneur|hopital|cnts|admin], hopital_id, actif, derniere_connexion, date_creation)
- donneurs(id, user_id, nom, prenom, telephone, email, date_naissance, sexe[homme|femme|autre], groupe_sanguin, poids_kg,
           region_id, ville, quartier, latitude, longitude, disponible, en_attente_validation, derniere_date_don, nombre_dons, date_inscription)
- stocks_sang(id, hopital_id, groupe_sanguin, quantite_poches, seuil_critique, date_maj)
- alertes(id, hopital_id, cree_par_user_id, groupe_sanguin, niveau_urgence[critique|urgent|normal], message,
          rayon_km, poches_necessaires, statut[en_cours|resolue|expiree|annulee],
          donneurs_contactes, donneurs_repondus, donneurs_acceptes, date_creation, date_resolution)
- reponses_alertes(id, alerte_id, donneur_id, reponse[accepte|refuse|pas_repondu], distance_km,
                   date_notification, date_reponse, date_lecture, message_donneur)
- historique_dons(id, donneur_id, hopital_id, alerte_id, date_don, groupe_sanguin, poches_prelevees, type_prelevement, apte, motif_inaptitude)

groupe_sanguin: A+, A-, B+, B-, AB+, AB-, O+, O-

Règles métier CNTS Sénégal :
- Délai inter-dons : 3 mois (hommes), 4 mois (femmes)
- Âge donneur : 18-65 ans, poids minimum 50 kg
- 1 poche de sang total se sépare en 3 composants : plaquettes (~7j), globules rouges (~40j), plasma (~1 an congelé)
- Groupes négatifs (O-, A-, B-, AB-) prioritaires car rares
- Donneur universel : O- / Receveur universel : AB+

Créateurs de la plateforme :
HemoLink a été créé par un groupe de 6 étudiants en DIC1 informatique de l'Ecole Supérieure Polytechnique de Dakar, Sénégal :
Mahamat Nassour Abdelsalam, Mariama Diop, Alhousseynou Agne, Cheikh Saliou Mbacké Lô, Madina Mohamed Tall, Mame Cheikh Guèye.
`;

function extractSql(text) {
  const fence = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return null;
}

function stripSqlFences(text) {
  return text.replace(/```(?:sql)?[\s\S]*?```/gi, '').replace(/\s+/g, ' ').trim();
}

async function groqComplete({ apiKey, model, system, userText, history = [], temperature = 0.4, maxTokens = 2048 }) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || res.statusText;
    throw new Error(msg || `Groq HTTP ${res.status}`);
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') throw new Error('Réponse Groq invalide');
  return content.trim();
}

async function replyNaturalFromData({ apiKey, model, userQuestion, rows, draftWithoutSql, role }) {
  const system = `Tu es l'assistant HemoLink pour la coordination du don de sang au Sénégal. Tu réponds en français,
ton naturel et empathique, professionnel et médical. Le rôle de l'utilisateur est : ${role || 'inconnu'}.

Règles strictes :
- Aucun JSON, aucun crochet [ ], aucune accolade { }, aucune liste technique brute.
- Ne mentionne jamais SQL, requête, base de données, table, ni "données brutes".
- N'affiche pas les comptes sous forme "(N résultats)".
- Intègre les faits utiles dans des phrases complètes, comme une vraie conversation.
- Si l'information est sensible (donneur identifiable), ne donne le nom complet et téléphone que si l'utilisateur est staff hôpital ou CNTS.
- Si on te demande qui a créé la plateforme, donne les noms des 6 étudiants de l'ESP Dakar sans utiliser de code SQL.`;

  let userMsg = `Question :\n${userQuestion}\n\n`;
  if (draftWithoutSql) userMsg += `Pistes : ${draftWithoutSql}\n\n`;
  userMsg += `Faits obtenus :\n${JSON.stringify(rows, null, 2)}`;

  return groqComplete({ apiKey, model, system, userText: userMsg, temperature: 0.45, maxTokens: 1024 });
}

router.post('/chat', requireAuth({ optional: true }), async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Assistant désactivé : définissez GROQ_API_KEY dans server/.env',
      reply:
        "L'assistant IA nécessite une clé API Groq. Créez une clé sur https://console.groq.com et renseignez GROQ_API_KEY dans server/.env.",
    });
  }

  const { messages, lastUserMessage } = req.body;
  const msgList = Array.isArray(messages) ? messages : [];
  const userText = lastUserMessage || (msgList.length ? msgList[msgList.length - 1]?.content : '') || '';
  if (!userText.trim()) return res.status(400).json({ error: 'Message vide' });

  // Historique de la conversation (hors dernier message, déjà dans userText) pour un vrai contexte multi-tour.
  const history = msgList
    .slice(0, -1)
    .slice(-8)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim());

  const role = req.user?.role || 'invite';
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const system = `Tu es l'assistant HemoLink. Coordination don de sang au Sénégal. Ton professionnel, médical, empathique.
Réponds en français.

Si la question nécessite des données précises (chiffres, listes, compatibilités, stocks, donneurs disponibles, statistiques),
produis UNE seule requête SELECT en lecture seule dans un bloc markdown \`\`\`sql ... \`\`\`.

Règles SQL :
- Une seule requête SELECT.
- Tables autorisées uniquement (voir schéma).
- Pas de commentaires SQL (-- ou /* */).
- Limite-toi à 50 lignes (LIMIT 50) sauf demande contraire explicite.

Pour les questions purement informationnelles (éligibilité, processus, conseils, sensibilisation, ou sur les créateurs de la plateforme), réponds directement
sans bloc SQL, en mobilisant les règles métier du schéma fourni.

Schéma :
${SCHEMA}`;

  try {
    const assistantText = await groqComplete({ apiKey, model, system, userText, history });

    const sql = extractSql(assistantText);
    const draftSansSql = stripSqlFences(assistantText);
    let reply;

    if (sql) {
      const v = validateReadOnlySql(sql);
      if (!v.ok) {
        reply =
          "Je ne peux pas répondre précisément pour le moment. Pouvez-vous reformuler ou préciser un autre critère ?";
      } else {
        try {
          const [rows] = await pool.query(v.sql);
          try {
            reply = await replyNaturalFromData({
              apiKey, model, userQuestion: userText, rows,
              draftWithoutSql: draftSansSql || undefined, role,
            });
          } catch (e) {
            console.error('naturalize', e);
            reply = draftSansSql || "Voici ce que j'ai trouvé. Pour plus de détail, reformulez votre question.";
          }
        } catch (e) {
          console.error(e);
          reply = "Une erreur technique s'est produite. Veuillez réessayer dans un instant.";
        }
      }
    } else {
      reply = draftSansSql || assistantText.trim();
    }

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e.message || 'Erreur assistant',
      reply: "Désolé, l'assistant n'a pas pu traiter la demande pour le moment.",
    });
  }
});

// --- Titre auto de conversation (3-5 mots) pour la sidebar de l'assistant ---
router.post('/title', requireAuth({ optional: true }), async (req, res) => {
  const userMessage = typeof req.body?.userMessage === 'string' ? req.body.userMessage.trim() : '';
  const assistantMessage = typeof req.body?.assistantMessage === 'string' ? req.body.assistantMessage : '';
  const fallback = userMessage.split(/\s+/).slice(0, 5).join(' ') || 'Nouvelle discussion';

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !userMessage) return res.json({ title: fallback });

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const system =
    "Génère un titre très court (3 à 5 mots maximum, en français, sans guillemets ni ponctuation finale) qui résume l'échange suivant. Réponds uniquement avec le titre, rien d'autre.";
  const userText = `Message utilisateur : ${userMessage}\nRéponse assistant : ${assistantMessage.slice(0, 400)}`;

  try {
    const raw = await groqComplete({ apiKey, model, system, userText, temperature: 0.3, maxTokens: 24 });
    const title = raw
      .split('\n')[0]
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .replace(/[.!?]+$/g, '')
      .trim();
    res.json({ title: title || fallback });
  } catch (e) {
    console.error('title', e);
    res.json({ title: fallback });
  }
});

// =====================================================================
// INTELLIGENCE PRÉDICTIVE (Lots 2 & 4)
// =====================================================================

// ---------------------------------------------------------------
// GET /api/ai/previsions  → prévisions de rupture de stock
// ---------------------------------------------------------------
// Staff hôpital : uniquement son hôpital. CNTS/admin : national
// (filtrable avec ?hopital_id=X). Option ?niveau=critique pour ne
// garder que les couples en danger.
router.get('/previsions', requireAuth(), requireRole('hopital', 'cnts', 'admin'), async (req, res) => {
  try {
    let hopitalId = null;
    if (req.user.role === 'hopital') {
      hopitalId = req.user.hopital_id;               // cloisonnement strict
    } else if (req.query.hopital_id) {
      hopitalId = Number(req.query.hopital_id) || null;
    }

    let previsions = await calculerPrevisions({ hopitalId });
    if (req.query.niveau) {
      previsions = previsions.filter((p) => p.niveau === req.query.niveau);
    }

    res.json({
      generee_le: new Date().toISOString(),
      fenetre_observation_jours: 90,
      methode: "Demande moyenne observée sur 90 jours (alertes) avec plancher de rotation basé sur le seuil critique. Autonomie = stock / consommation estimée. Alerte à J-7.",
      resume: resumerPrevisions(previsions),
      previsions,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur prévisions de stock' });
  }
});

// ---------------------------------------------------------------
// POST /api/ai/generer-notifications  → notifications intelligentes
// ---------------------------------------------------------------
// Exécute les 2 règles automatiques (rappels d'éligibilité donneurs +
// stock critique prédictif staff). Idempotent : rejouable sans doublon.
// Réservé cnts/admin — aussi disponible en CLI : node scripts/auto-notifs.js
router.post('/generer-notifications', requireAuth(), requireRole('cnts', 'admin'), async (req, res) => {
  try {
    const bilan = await genererNotificationsAuto();
    await audit(req, 'generer_notifications_auto', 'notifications', null, bilan);
    res.json({ ok: true, ...bilan });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur génération notifications' });
  }
});

export default router;


// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (25 secondes) :
// ---------------------------------------------------------------------
// L'assistant IA est notre brique différenciante. Le pipeline est subtil :
//   1. On donne à Groq/Llama le SCHÉMA complet de la base + les règles
//      métier CNTS dans le system prompt
//   2. L'IA reçoit la question et décide : pure info (réponse directe) ou
//      requête data (génère un SELECT dans un bloc markdown)
//   3. Si SQL : sqlGuard vérifie (SELECT only, tables whitelist, etc.)
//      puis on exécute en lecture seule
//   4. On rappelle Llama avec les RÉSULTATS bruts et on lui dit
//      "reformule en phrases naturelles en français, pas de JSON"
// L'utilisateur a l'impression de discuter avec un expert qui connaît
// les chiffres en temps réel. Et c'est sécurisé : le garde SQL empêche
// l'IA de modifier quoi que ce soit, même si elle voulait. Llama 3.3 70B
// via Groq = latence < 1s et gratuit pour usage faible.
// =====================================================================
