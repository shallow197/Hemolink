// =====================================================================
// AiSidebar.jsx — Sidebar de l'assistant IA HemoLink
// =====================================================================
// Interface de chat slide-in à droite. L'utilisateur tape une question,
// elle est envoyée à /api/ai/chat qui interroge Groq (Llama 3.3 70B).
// Quatre suggestions rapides en haut pour gagner du temps en démo.
// =====================================================================

import { useState } from 'react';
import { fetchJson } from '../api';

// --- Suggestions rapides cliquables (gain de temps en démo) ---
const SUGGESTIONS = [
  'Donneurs O+ disponibles à Dakar',
  'Hôpitaux en stock critique',
  'Alertes actives ce soir',
  'Statistiques du mois',
];

export default function AiSidebar({ open, onToggle }) {
  // Historique de la conversation (initialisé avec un message d'accueil)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour, je suis l'assistant HemoLink. Posez-moi une question sur les donneurs, les stocks ou les alertes." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Envoi d'un message à l'API IA ---
  // 1. On ajoute immédiatement le message user dans la liste (UX réactif)
  // 2. On appelle /api/ai/chat avec le texte
  // 3. La réponse de l'assistant est ajoutée à la liste
  async function send(text) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setInput('');
    setLoading(true);
    try {
      const data = await fetchJson('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ lastUserMessage: t }),
      });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Erreur : ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-300 ${
        open ? 'w-full sm:w-[380px]' : 'w-0 overflow-hidden border-0'
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Assistant IA HemoLink</p>
            <p className="text-xs text-gray-400">Groq · données en direct</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-3 py-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-blood hover:bg-red-100 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'ml-6 bg-blood text-white shadow-sm'
                  : 'mr-4 border border-gray-100 bg-slate-50 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {loading && <p className="text-xs text-gray-400">Réflexion en cours…</p>}
        </div>

        <form
          className="border-t border-gray-100 bg-white p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
              placeholder="Votre question…"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blood px-3 py-2 text-sm font-medium text-white hover:bg-blood-dark disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// La sidebar IA est notre élément différenciant. Quand le médecin de Fann
// veut savoir "combien de O- disponibles à Dakar ?", il n'a pas besoin de
// connaître SQL ni de cliquer dans 5 menus : il pose la question en
// français, l'IA (Llama 3.3 70B via Groq) génère la requête SELECT,
// notre garde de sécurité (sqlGuard.js) vérifie qu'elle est inoffensive,
// on l'exécute en lecture seule, puis on RE-DEMANDE à l'IA de reformuler
// les résultats bruts en phrase naturelle. L'utilisateur ne voit jamais
// ni le SQL ni le JSON brut. Les suggestions cliquables en haut permettent
// de démontrer la fonctionnalité en 2 secondes pendant la soutenance.
// =====================================================================
