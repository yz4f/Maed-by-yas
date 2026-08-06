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
        'neon-glow': '0 0 25px rgba(56, 189, 248, 0.25)',
        'neon-hover': '0 0 35px rgba(56, 189, 248, 0.45)',
        'purple-glow': '0 0 25px rgba(168, 85, 247, 0.25)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
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
