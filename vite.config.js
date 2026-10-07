import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client lives in client/, the API in server/. In development Vite proxies /api to Express.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': 'http://localhost:3000' }
  }
});
