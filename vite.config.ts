import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Step 5 uses small, legible vendor chunk boundaries so the globe stack
        // no longer ships as one warning-sized bundle blob.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }

          if (id.includes('/@react-three/drei/')) {
            return 'globe-drei';
          }

          if (id.includes('/cesium/')) {
            return 'local-context-cesium';
          }

          if (
            id.includes('/@react-three/fiber/') ||
            id.includes('/three-stdlib/') ||
            id.includes('/suspend-react/')
          ) {
            return 'globe-runtime';
          }

          if (id.includes('/three/')) {
            return 'three-core';
          }

          return undefined;
        },
      },
    },
  },
});
