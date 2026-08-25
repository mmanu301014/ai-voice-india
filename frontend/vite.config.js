import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars so we can read VITE_API_URL in vite.config if needed
  const env = loadEnv(mode, process.cwd(), '');

  // For local dev: proxy /api → backend server
  // In production build, VITE_API_URL is set directly so no proxy is needed
  const backendTarget = env.VITE_DEV_BACKEND || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      },
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  };
});
