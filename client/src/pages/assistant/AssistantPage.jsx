import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatProvider, useChat } from '../../contexts/ChatContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ChatSidebar from '../../components/assistant/ChatSidebar.jsx';
import MessageBubble from '../../components/assistant/MessageBubble.jsx';
import ChatInput from '../../components/assistant/ChatInput.jsx';
import { IconMenu, IconX } from '../../components/icons.jsx';

const SUGGESTIONS = [
  'Donneurs O+ disponibles à Dakar',
  'Hôpitaux en stock critique',
  'Alertes actives ce soir',
  'Statistiques du mois',
];

function AssistantContent() {
  const {
    conversations,
    active,
    activeId,
    loading,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const messages = active?.messages || [];
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  function handleClose() {
    const fallback = user?.role === 'donneur' ? '/mon-espace' : '/staff';
    if (window.history.length > 2) navigate(-1);
    else navigate(fallback);
  }

  return (
    <div className="relative flex h-[calc(100vh-190px)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card md:h-[calc(100vh-140px)]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-navy/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={createConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-navy to-brand-navy-light px-3 py-2.5 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-white/20 bg-white/10 p-1.5 text-white md:hidden"
              aria-label="Ouvrir l'historique des discussions"
            >
              <IconMenu className="h-4 w-4" />
            </button>
            <p className="truncate text-sm font-semibold">{active?.title || 'Assistant IA HemoLink'}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            aria-label="Réduire l'assistant"
            title="Réduire l'assistant"
          >
            <IconX className="h-4 w-4" />
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-lg pt-8 text-center">
              <p className="font-display text-lg font-bold text-brand-navy">Assistant IA HemoLink</p>
              <p className="mt-1 text-sm text-slate-500">
                Posez une question sur les donneurs, les stocks ou les alertes.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className="rounded-full border border-blood/20 bg-blood-light px-3 py-1.5 text-xs font-medium text-blood hover:bg-blood/10 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} text={m.text} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-11 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
              Réflexion en cours…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={sendMessage} disabled={loading} />
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <ChatProvider>
      <AssistantContent />
    </ChatProvider>
  );
}
