module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        main: 'var(--color-main)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        gray1: 'var(--color-gray-1)',
        gray2: 'var(--color-gray-2)',
        gray3: 'var(--color-gray-3)',
        white: 'var(--color-white)',
        black: 'var(--color-black)'
      }
    }
  },
  plugins: []
};
