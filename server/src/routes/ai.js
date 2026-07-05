import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateReadOnlySql } from '../utils/sqlGuard.js';
import { requireAuth } from '../middleware/auth.js';

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
`;

function extractSql(text) {
  const fence = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return null;
}

function stripSqlFences(text) {
  return text.replace(/```(?:sql)?[\s\S]*?```/gi, '').replace(/\s+/g, ' ').trim();
}

async function groqComplete({ apiKey, model, system, userText, temperature = 0.4, maxTokens = 2048 }) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
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
- Si l'information est sensible (donneur identifiable), ne donne le nom complet et téléphone que si l'utilisateur est staff hôpital ou CNTS.`;

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
  const userText =
    lastUserMessage ||
    (Array.isArray(messages) && messages.length ? messages[messages.length - 1]?.content : '') ||
    '';
  if (!userText.trim()) return res.status(400).json({ error: 'Message vide' });

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

Pour les questions purement informationnelles (éligibilité, processus, conseils, sensibilisation), réponds directement
sans bloc SQL, en mobilisant les règles métier du schéma fourni.

Schéma :
${SCHEMA}`;

  try {
    const assistantText = await groqComplete({ apiKey, model, system, userText });

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

export default router;
