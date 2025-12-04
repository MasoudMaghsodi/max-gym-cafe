import { defineConfig } from 'vite';

export default defineConfig({
    // Base path for GitHub Pages (custom domain = root)
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true
    },
    server: {
        port: 3000,
        open: true
    }
});
