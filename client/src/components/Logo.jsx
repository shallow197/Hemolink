export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M24 4C18 12 10 18 10 28c0 8.5 6.3 15 14 15s14-6.5 14-15c0-10-8-16-14-24z"
        fill="#CC0000"
        stroke="#990000"
        strokeWidth="1.2"
      />
      <path
        d="M18 26c2-2 4-3 6-5 2 2 4 3 6 5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 30h8M22 32h4"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="22" rx="2.2" ry="2.2" fill="white" opacity="0.95" />
    </svg>
  );
}
