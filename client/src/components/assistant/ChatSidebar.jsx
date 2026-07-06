import { useState } from 'react';
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '../icons.jsx';

const GROUP_ORDER = ["Aujourd'hui", 'Hier', 'Plus tôt'];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupLabel(ts) {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(ts));
  const diffDays = Math.round((today - day) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return 'Plus tôt';
}

export default function ChatSidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, onNavigate }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: conversations.filter((c) => groupLabel(c.updatedAt) === label),
  })).filter((g) => g.items.length);

  function startEdit(c) {
    setConfirmingId(null);
    setEditingId(c.id);
    setDraft(c.title);
  }

  function confirmEdit() {
    if (editingId) onRename(editingId, draft || 'Nouvelle discussion…');
    setEditingId(null);
  }

  return (
    <div className="flex h-full w-72 max-w-[80vw] flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            onNew();
            onNavigate?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-red-950/30"
        >
          <IconPlus className="h-4 w-4" />
          Nouvelle discussion
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && (
          <p className="px-2 text-xs text-zinc-500">Aucune discussion pour le moment.</p>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((c) => {
                const isActive = c.id === activeId;
                const isEditing = editingId === c.id;
                const isConfirming = confirmingId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm ${
                      isActive ? 'bg-red-950/40 text-red-200' : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={confirmEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-red-800"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={confirmEdit}
                          className="shrink-0 rounded-md p-1 text-emerald-400 hover:bg-zinc-800"
                          aria-label="Valider le renommage"
                        >
                          <IconCheck className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(c.id);
                            onNavigate?.();
                          }}
                          className="min-w-0 flex-1 truncate text-left"
                          title={c.title}
                        >
                          {c.title || 'Nouvelle discussion…'}
                        </button>
                        {isConfirming ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onDelete(c.id);
                                setConfirmingId(null);
                              }}
                              className="shrink-0 rounded-md p-1 text-red-400 hover:bg-zinc-800"
                              aria-label="Confirmer la suppression"
                            >
                              <IconCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(null)}
                              className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-800"
                              aria-label="Annuler la suppression"
                            >
                              <IconX className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              className="shrink-0 rounded-md p-1 text-zinc-400 opacity-100 transition-opacity hover:bg-zinc-800 hover:text-zinc-100 md:opacity-0 md:group-hover:opacity-100"
                              aria-label="Renommer"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(c.id)}
                              className="shrink-0 rounded-md p-1 text-zinc-400 opacity-100 transition-opacity hover:bg-zinc-800 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
                              aria-label="Supprimer"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
