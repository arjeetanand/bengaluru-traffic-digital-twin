import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const pages = [
  'index.html',
  'parks/prestige-tech-park/index.html',
  'parks/rmz-ecospace/index.html',
  'parks/bagmane-world-technology-centre/index.html',
  'parks/google-ananta/index.html'
].map((path) => fileURLToPath(new URL(path, import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4003,
    host: '127.0.0.1',
    strictPort: true
  },
  build: {
    rollupOptions: { input: pages }
  }
});
