export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="hl-drop" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E63950" />
          <stop offset="1" stopColor="#9B1830" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="#0B1F33" />
      <path
        d="M24 10C19 16.5 12 21.5 12 29c0 6.5 5 11.5 12 11.5s12-5 12-11.5c0-7.5-7-12.5-12-18.5z"
        fill="url(#hl-drop)"
      />
      <path
        d="M18 28c2-2 4-3 6-4.5 2 1.5 4 2.5 6 4.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <ellipse cx="24" cy="24" rx="2" ry="2" fill="white" opacity="0.9" />
    </svg>
  );
}
