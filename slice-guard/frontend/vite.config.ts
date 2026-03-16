import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss() as any],
    resolve: {
        alias: {
            '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
        },
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['src/__tests__/setup.ts'],
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
            ws: {
                target: 'ws://localhost:3000',
                ws: true,
            },
        },
    },
});
