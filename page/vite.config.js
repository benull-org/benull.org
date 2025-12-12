import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 5555,
        strictPort: true,
    },
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                articles: 'articles/index.html',
            },
        },
    },
});
