import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// cPanel-friendly: base './' works in domain root or subfolder.
// Dev proxy forwards /api to local PHP server (php -S localhost:8000 -t backend).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
      '/fonts': 'http://127.0.0.1:8000'
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  }
});
