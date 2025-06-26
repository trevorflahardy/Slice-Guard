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
        'accent-text': 'var(--color-accent-text)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        "gray-1": 'var(--color-gray-1)',
        "gray-2": 'var(--color-gray-2)',
        "gray-3": 'var(--color-gray-3)',
      }
    }
  },
  plugins: []
};
