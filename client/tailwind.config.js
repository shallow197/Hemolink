/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1F33',
          'navy-light': '#143352',
          slate: '#1E3A5F',
          cream: '#F8FAFC',
        },
        blood: {
          DEFAULT: '#C41E3A',
          dark: '#9B1830',
          light: '#FEF2F4',
          muted: '#E8A0AB',
        },
        accent: {
          teal: '#0D9488',
          gold: '#D97706',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(11 31 51 / 0.06), 0 8px 24px -4px rgb(11 31 51 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(11 31 51 / 0.08), 0 16px 40px -8px rgb(11 31 51 / 0.12)',
        header: '0 1px 0 0 rgb(11 31 51 / 0.06), 0 4px 16px -2px rgb(11 31 51 / 0.06)',
        glow: '0 0 0 1px rgb(196 30 58 / 0.12), 0 8px 32px -8px rgb(196 30 58 / 0.25)',
      },
      backgroundImage: {
        'mesh-public': 'radial-gradient(at 20% 0%, rgb(196 30 58 / 0.08) 0px, transparent 50%), radial-gradient(at 80% 20%, rgb(13 148 136 / 0.06) 0px, transparent 45%), radial-gradient(at 50% 100%, rgb(11 31 51 / 0.04) 0px, transparent 50%)',
        'mesh-app': 'radial-gradient(at 0% 0%, rgb(196 30 58 / 0.05) 0px, transparent 40%), radial-gradient(at 100% 0%, rgb(11 31 51 / 0.04) 0px, transparent 35%)',
        'hero-gradient': 'linear-gradient(135deg, #0B1F33 0%, #143352 45%, #1a3d5c 70%, #0f2840 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
