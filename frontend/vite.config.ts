import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
  },
  preview: {
    port: Number(process.env.PORT ?? 4173),
    strictPort: true,
  },
  build: {
    // Third-party code changes far less often than application code. Splitting
    // it into its own chunk means editing a component does not invalidate the
    // cached vendor bundle for returning visitors.
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
});
