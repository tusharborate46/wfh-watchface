import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // face-api.js bundles several large model loaders; raise the limit so
    // the build doesn't treat its expected size as a CI-breaking warning.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // rolldown (Vite 8) requires manualChunks to be a function, not an object.
        // Split face-api into its own chunk so the React app shell loads faster.
        manualChunks(id) {
          if (id.includes('face-api.js')) return 'faceapi';
        }
      }
    }
  }
});
