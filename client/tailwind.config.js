/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A1128',
          'navy-light': '#121E42',
          slate: '#1E293B',
          cream: '#F8FAFC',
        },
        blood: {
          DEFAULT: '#D90429',
          dark: '#B00020',
          light: '#FFF0F2',
          muted: '#FFB3C1',
        },
        accent: {
          teal: '#00B4D8',
          gold: '#FFB703',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(10, 17, 40, 0.05), 0 1px 3px rgba(10, 17, 40, 0.02)',
        'card-hover': '0 10px 30px rgba(10, 17, 40, 0.1), 0 4px 8px rgba(10, 17, 40, 0.04)',
        header: '0 4px 20px -2px rgba(10, 17, 40, 0.08)',
        glow: '0 0 20px rgba(217, 4, 41, 0.4), 0 0 40px rgba(217, 4, 41, 0.1)',
        'glow-teal': '0 0 20px rgba(0, 180, 216, 0.4)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(10, 17, 40, 0.95) 0%, rgba(18, 30, 66, 0.85) 100%)',
        'mesh-app': 'radial-gradient(at 0% 0%, rgba(217, 4, 41, 0.04) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0, 180, 216, 0.04) 0px, transparent 50%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
    },
  },
  plugins: [],
};
