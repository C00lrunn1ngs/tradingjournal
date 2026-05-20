import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'tj-bg':     '#080f18',
        'tj-card':   '#0b1520',
        'tj-hover':  '#0f1e2e',
        'tj-border': '#1a2e40',
        'tj-active': '#0f2535',
        'tj-text':   '#e2f0f7',
        'tj-text2':  '#9ab8c8',
        'tj-muted':  '#4a6a7a',
        'tj-muted2': '#3a5a6a',
        'tj-teal':   '#00d4aa',
        'tj-blue':   '#7eb8d4',
        'tj-red':    '#ff6b6b',
        'tj-yellow': '#ffd166',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
