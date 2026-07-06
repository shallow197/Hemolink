import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { fetchJson } from '../api';

const ChatContext = createContext(null);

function storageKey(userId) {
  return `hemolink_chats_${userId || 'anon'}`;
}

function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadConversations(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(userId, conversations) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(conversations));
  } catch {
    /* stockage indisponible (navigation privée, quota…) : on ignore */
  }
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [conversations, setConversations] = useState(() => loadConversations(userId));
  const [activeId, setActiveId] = useState(() => loadConversations(userId)[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const loadedUserRef = useRef(userId);

  useEffect(() => {
    if (loadedUserRef.current === userId) return;
    loadedUserRef.current = userId;
    const loaded = loadConversations(userId);
    setConversations(loaded);
    setActiveId(loaded[0]?.id ?? null);
  }, [userId]);

  useEffect(() => {
    saveConversations(userId, conversations);
  }, [userId, conversations]);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  );

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);

  const createConversation = useCallback(() => {
    const conv = {
      id: newId(),
      title: 'Nouvelle discussion…',
      titleGenerated: false,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((cs) => [conv, ...cs]);
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const selectConversation = useCallback((id) => setActiveId(id), []);

  const renameConversation = useCallback((id, title) => {
    const t = title.trim();
    if (!t) return;
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, title: t, titleGenerated: true } : c)));
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations((cs) => {
      const next = cs.filter((c) => c.id !== id);
      setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
  }, []);

  const generateTitle = useCallback(async (id, userMessage, assistantMessage) => {
    try {
      const data = await fetchJson('/api/ai/title', {
        method: 'POST',
        body: JSON.stringify({ userMessage, assistantMessage }),
      });
      setConversations((cs) =>
        cs.map((c) => (c.id === id && !c.titleGenerated ? { ...c, title: data.title, titleGenerated: true } : c))
      );
    } catch {
      /* le titre par défaut reste affiché */
    }
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const t = text.trim();
      if (!t) return;

      let convId = activeId;
      let priorMessages = [];
      const existing = conversations.find((c) => c.id === convId);
      if (!existing) {
        convId = createConversation();
      } else {
        priorMessages = existing.messages;
      }

      const userMsg = { id: newId(), role: 'user', text: t, createdAt: Date.now() };
      setConversations((cs) =>
        cs.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() } : c))
      );
      setLoading(true);

      try {
        const history = priorMessages.map((m) => ({ role: m.role, content: m.text }));
        const data = await fetchJson('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ messages: [...history, { role: 'user', content: t }] }),
        });
        const assistantMsg = { id: newId(), role: 'assistant', text: data.reply, createdAt: Date.now() };
        setConversations((cs) =>
          cs.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() } : c))
        );

        if (priorMessages.length === 0) generateTitle(convId, t, data.reply);
      } catch (e) {
        const errMsg = { id: newId(), role: 'assistant', text: `Erreur : ${e.message}`, createdAt: Date.now() };
        setConversations((cs) =>
          cs.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() } : c))
        );
      } finally {
        setLoading(false);
      }
    },
    [activeId, conversations, createConversation, generateTitle]
  );

  const value = {
    conversations: sorted,
    active,
    activeId,
    loading,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat doit être utilisé dans ChatProvider');
  return ctx;
}
