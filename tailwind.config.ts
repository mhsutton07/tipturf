import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      minHeight: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
      colors: {
        surface: {
          DEFAULT: '#111827',
          card: '#1f2937',
          input: '#374151',
          hover: '#2d3748',
        },
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea6c0a',
          muted: '#c2560e',
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        success: {
          DEFAULT: '#22c55e',
        },
        text: {
          primary: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};

export default config;
