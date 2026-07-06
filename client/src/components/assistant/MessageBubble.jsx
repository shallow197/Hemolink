import { IconBot, IconUser } from '../icons.jsx';

export default function MessageBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-blood text-white' : 'border border-zinc-700 bg-zinc-900 text-red-400'
        }`}
      >
        {isUser ? <IconUser className="h-4 w-4" /> : <IconBot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser ? 'bg-blood text-white shadow-blood/20' : 'border border-zinc-700/80 bg-zinc-900 text-zinc-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
