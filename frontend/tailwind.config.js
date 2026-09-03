/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        mut: 'var(--mut)',
        acc: 'var(--acc)',
        acc2: 'var(--acc2)'
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'Tahoma', 'sans-serif']
      }
    }
  },
  plugins: []
};
