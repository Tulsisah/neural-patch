/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: 'var(--cyber-bg)',          // Dynamic background
          card: 'var(--cyber-card)',        // Dynamic card
          border: 'var(--cyber-border)',    // Dynamic border
          primary: '#6366F1',     // Indigo/Violet
          primaryGlow: 'var(--cyber-primary-glow)',
          success: '#10B981',     // Emerald Green
          warning: '#F59E0B',     // Amber
          danger: '#EF4444',      // Cyber Red
          info: '#3B82F6',        // Electric Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s infinite ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
