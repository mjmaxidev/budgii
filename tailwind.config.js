/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './qa/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFF5EA',
        surface: '#FFFFFF',
        surfaceSoft: '#FFFBF6',
        primary: '#FF6A00',
        primarySoft: '#FFF0E5',
        green: '#16A34A',
        greenSoft: '#EAF8ED',
        orange: '#FB8500',
        orangeSoft: '#FFF2DF',
        red: '#EF4444',
        redSoft: '#FEECEC',
        blue: '#2386F6',
        blueSoft: '#EAF4FF',
        purple: '#9B5DE5',
        purpleSoft: '#F2E8FF',
        yellowSoft: '#FFF7D6',
        ink: '#111827',
        muted: '#6B7280',
        line: '#EFE5DA',
      },
      borderRadius: {
        card: '24px',
        input: '18px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(80, 60, 40, 0.12)',
        card: '0 2px 12px -2px rgba(80, 60, 40, 0.08)',
        ring: '0 12px 32px -12px rgba(80, 60, 40, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
