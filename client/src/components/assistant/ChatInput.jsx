import { useEffect, useRef, useState } from 'react';
import { IconSend } from '../icons.jsx';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function submit() {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="border-t border-slate-100 bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-blood focus-within:bg-white focus-within:ring-2 focus-within:ring-blood/15">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
          className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-brand-navy placeholder-slate-400 outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blood text-white shadow-glow transition hover:bg-blood-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          aria-label="Envoyer"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
