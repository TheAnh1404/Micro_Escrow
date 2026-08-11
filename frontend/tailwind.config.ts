import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A', // Dark Navy Slate
        surface: '#1E293B',    // Card Surface
        'surface-hover': '#334155',
        primary: {
          DEFAULT: '#06B6D4',  // Cyan Electric
          hover: '#0891B2',
        },
        secondary: {
          DEFAULT: '#8B5CF6',  // Indigo / Violet
          hover: '#7C3AED',
        },
        border: 'rgba(51, 65, 85, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-secondary': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
