import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 5556, // Different port from main app
        strictPort: true,
    }
});
