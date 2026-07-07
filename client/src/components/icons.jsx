function Svg({ children, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconPlus({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconPencil({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  );
}

export function IconTrash({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function IconSend({ className }) {
  return (
    <Svg className={className}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </Svg>
  );
}

export function IconMenu({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function IconX({ className }) {
  return (
    <Svg className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function IconCheck({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function IconBot({ className }) {
  return (
    <Svg className={className}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <path d="M8 13v2M16 13v2" />
    </Svg>
  );
}

export function IconUser({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

export function IconHome({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </Svg>
  );
}

export function IconUsers({ className }) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
      <path d="M16.5 5.2A3.2 3.2 0 0 1 17 11.5" />
      <path d="M21.5 20c0-2.8-2-4.8-4.7-5.4" />
    </Svg>
  );
}

export function IconHospital({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 21V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v15" />
      <path d="M3 21h18" />
      <path d="M12 9v5M9.5 11.5h5" />
      <path d="M9 21v-4h6v4" />
    </Svg>
  );
}

export function IconAlert({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5v.01" />
    </Svg>
  );
}

export function IconGlobe({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9Z" />
    </Svg>
  );
}

export function IconMessage({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </Svg>
  );
}

export function IconHistory({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  );
}

export function IconChevronDown({ className }) {
  return (
    <Svg className={className}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconShield({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3 4.5 5.5V11c0 4.7 3.2 8.4 7.5 9.9 4.3-1.5 7.5-5.2 7.5-9.9V5.5L12 3Z" />
      <path d="m9.5 12 1.8 1.8L14.8 10" />
    </Svg>
  );
}
