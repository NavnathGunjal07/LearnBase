import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107', // main
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
      },
      boxShadow: {
        'saffron-glow': '0 4px 24px 0 rgba(255, 193, 7, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config


