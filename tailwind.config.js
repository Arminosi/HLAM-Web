/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hlam: {
          bg: '#1e1e2e',
          surface: '#282838',
          panel: '#313145',
          border: '#45455a',
          accent: '#89b4fa',
          'accent-hover': '#b4d8fd',
          text: '#cdd6f4',
          'text-dim': '#a6adc8',
          'text-muted': '#6c7086',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
