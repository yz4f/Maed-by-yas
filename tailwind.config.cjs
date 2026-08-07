/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#050505',
          card: '#0a0a0a',
          border: '#1a1a1a',
          hover: '#141414',
        },
        primary: {
          DEFAULT: '#38bdf8', // Neon Sky/Cyan Blue
          hover: '#0ea5e9', // Deep Sky Blue
          glow: 'rgba(56, 189, 248, 0.4)',
        },
        secondary: {
          DEFAULT: '#3b82f6', // Electric Blue
          hover: '#2563eb', // Royal Blue
          glow: 'rgba(59, 130, 246, 0.4)',
        },
        navy: {
          900: '#0b0f19',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        neon: {
          blue: '#38bdf8',
          cyan: '#22d3ee',
          indigo: '#6366f1',
          purple: '#a855f7',
        },
      },
      boxShadow: {
        'brand-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'brand-glow': '0 0 20px rgba(56, 189, 248, 0.35)',
        'neon-glow': '0 0 25px rgba(56, 189, 248, 0.25)',
        'neon-hover': '0 0 35px rgba(56, 189, 248, 0.45)',
        'purple-glow': '0 0 25px rgba(168, 85, 247, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
