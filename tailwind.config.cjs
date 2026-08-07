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
          dark: '#0B0E14', // Deep Navy-black background
          card: '#141822', // Card background
          border: 'rgba(255,255,255,0.06)', // Sleek minimal border
          hover: '#1E2533', // Hover background
          sidebar: '#0B0E14', // Left sidebar background
          sidebarBorder: 'rgba(255,255,255,0.06)',
          text: '#F5F5F7', // Primary light text
          muted: '#9CA3AF', // Slate Grey secondary text
          accent: '#6366F1', // Primary indigo accent
          surface: '#141822',
        },
        primary: {
          DEFAULT: '#6366F1', // Indigo Accent
          hover: '#5457e5',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet Accent
          hover: '#7c4df2',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        navy: {
          900: '#070A13',
          800: '#0F131E',
          700: '#1E293B',
          600: '#475569',
        },
        neon: {
          blue: '#3B82F6',
          cyan: '#60A5FA',
          indigo: '#93C5FD',
          purple: '#1E293B',
        },
      },
      boxShadow: {
        'brand-card': '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
        'brand-glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'neon-glow': '0 0 25px rgba(59, 130, 246, 0.15)',
        'neon-hover': '0 0 35px rgba(59, 130, 246, 0.25)',
        'purple-glow': '0 0 25px rgba(59, 130, 246, 0.15)',
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
