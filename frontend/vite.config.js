import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AWS App Runner routes traffic to whatever port the app listens on and expects
// it bound to 0.0.0.0 (not just localhost); it assigns a dynamic *.awsapprunner.com
// host, so Vite's preview host-check needs to allow it too. PORT is read from the
// environment so it matches whatever port the App Runner service config sets.
const previewPort = Number(process.env.PORT) || 8080;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: previewPort,
    allowedHosts: true,
  },
});
