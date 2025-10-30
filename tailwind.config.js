/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Emotion-based color palette
        emotion: {
          calm: '#3B82F6',
          calmLight: '#DBEAFE',
          stressed: '#F59E0B',
          stressedLight: '#FEF3C7',
          anxious: '#A78BFA',
          anxiousLight: '#F3E8FF',
          sad: '#FB923C',
          sadLight: '#FFEDD5',
          happy: '#22C55E',
          happyLight: '#DCFCE7',
          energized: '#EC4899',
          energizedLight: '#FCE7F3',
          frustrated: '#EF4444',
          frustratedLight: '#FEE2E2',
          fatigued: '#64748B',
          fatiguedLight: '#F1F5F9',
        }
      },
      keyframes: {
        'breathing': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      },
      animation: {
        'breathing': 'breathing 4s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
