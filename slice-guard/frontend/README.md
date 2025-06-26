# Slice Guard Frontend

This project uses **Vue 3**, **TypeScript**, **Vite** and **Tailwind CSS**. The default template has been removed and replaced with a minimal setup that supports light and dark themes. Vue Router is configured for future page navigation.

## Development

Install dependencies in the `frontend` directory and start the dev server:

```bash
bun install
bun run dev
```

## Project Structure

The frontend is organised to scale with additional features:

```
src/
  components/   reusable UI components
  views/        page level views used by the router
  router/       Vue Router configuration
  store/        application state (Pinia)
  styles/       global styles and tailwind configuration
```

The project now includes `views` and `router` out of the box so routing can be expanded easily. Use these directories when adding new pages.

### Reusable Button Component

`src/components/Button.vue` exposes a small button with `primary` and `secondary` variants. Use it throughout the app for consistent styling.

## Tailwind and Theme

`tailwind.config.cjs` exposes a comprehensive set of colour variables. The palette follows Apple's soft tones:

- `main` – lighter British Racing Green (`#005e3c` in light mode, `#1ba56e` in dark mode)
- `accent` – modern highlight (`#30d158`)
- `accent-text` – black in light mode, white in dark mode
- `background`/`surface` – page and card backgrounds
- `foreground`/`muted` – primary and secondary text colours
- `border` – subtle outlines
- `gray1`, `gray2`, `gray3` – neutral tiers for layouts
- `success`, `warning`, `error`, `info` – status colours
- `white` and `black` remain available

Reference these names in classes like `text-main` or `bg-surface`.

Add or remove the `dark` class on the `html` element to toggle dark mode. `HomeView.vue` includes a sample toggle button.
