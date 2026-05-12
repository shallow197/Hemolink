import { useState } from 'react';
import { fetchJson } from '../api';

const SUGGESTIONS = [
  'Donneurs O+ disponibles à Dakar',
  'Hôpitaux en stock critique',
  'Alertes actives ce soir',
  'Statistiques du mois',
];

export default function AiSidebar({ open, onToggle }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Bonjour, je suis l'assistant HemoLink. Posez-moi une question sur les donneurs, les stocks ou les alertes." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
      className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 transition-all duration-300 ${
        open ? 'w-full sm:w-[380px]' : 'w-0 overflow-hidden border-0'
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Assistant IA HemoLink</p>
            <p className="text-xs text-zinc-500">Groq · données en direct</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Fermer
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 px-3 py-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-red-900/40 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-red-950/40 hover:text-red-50"
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
                  ? 'ml-6 bg-blood text-white shadow-md shadow-blood/20'
                  : 'mr-4 border border-zinc-700/80 bg-zinc-900 text-zinc-100'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          ))}
          {loading && <p className="text-xs text-zinc-500">Réflexion en cours…</p>}
        </div>

        <form
          className="border-t border-zinc-800 bg-black/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-red-900/30 focus:border-red-800 focus:ring-2"
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
