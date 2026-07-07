import { IconBot, IconUser } from '../icons.jsx';

export default function MessageBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-blood text-white' : 'bg-brand-navy text-white'
        }`}
      >
        {isUser ? <IconUser className="h-4 w-4" /> : <IconBot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser ? 'bg-blood text-white' : 'border border-slate-200/80 bg-white text-brand-navy'
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
