import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const backendUrl = env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      hmr: true,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-leaflet') || id.includes('leaflet')) return 'maps';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('react-markdown') || id.includes('remark-') || id.includes('mdast') || id.includes('micromark')) return 'markdown';
            if (id.includes('@google/genai')) return 'ai';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('motion')) return 'motion';
          },
        },
      },
    },
  };
});
