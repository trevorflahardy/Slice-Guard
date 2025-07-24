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
