/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#050505', // True black background
          card: '#0F0F11', // Very dark gray for cards
          border: 'rgba(255,255,255,0.06)', // Lighter elegant border
          hover: '#17171A', // Hover surface
          sidebar: '#0A0A0B', // Sidebar background
          sidebarBorder: 'rgba(255,255,255,0.05)',
          text: '#FAFAFA', // Primary light text
          muted: '#8D8D8D', // Neutral Slate Grey
          accent: '#3B82F6', // Primary Electric Blue
          surface: '#121214',
        },
        primary: {
          DEFAULT: '#3B82F6', // Electric Blue
          hover: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.25)',
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        success: {
          DEFAULT: '#10B981', // Emerald/Teal
          hover: '#059669',
        },
        danger: {
          DEFAULT: '#F43F5E', // Red/Pink
          hover: '#E11D48',
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber
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
