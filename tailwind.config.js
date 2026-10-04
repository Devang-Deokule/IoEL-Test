/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        canvas: '#E6EFFA',
        surface: '#F7FAFE',
        chrome: '#D9E8F8',
        line: '#C3D6EC',
        ink: { DEFAULT: '#14233A', soft: '#4B5B71', mute: '#516279' },
        brand: {
          50: '#EEF4FD',
          100: '#DCE8FA',
          200: '#BCD2F5',
          400: '#4F86E0',
          500: '#2F6FD6',
          600: '#1F5CC4',
          700: '#184BA0',
        },
        ok: { DEFAULT: '#0F7A56', bg: '#E3F4EC' },
        warn: { DEFAULT: '#9A5B00', bg: '#FFF1D1' },
        danger: { DEFAULT: '#BB2D28', bg: '#FDEAE9' },
        info: { DEFAULT: '#1F5CC4', bg: '#E7EFFC' },
      },
    },
  },
  plugins: [],
};
