import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  const isEmbeddedBuild = mode === 'embedded';

  return {
    base: command === 'build' ? env.VITE_ASSET_BASE_PATH || '/' : '/',
    plugins: [react()],
    server: {
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': {
          target:
            env.VITE_API_PROXY_TARGET ||
            'http://127.0.0.1:8000',
        },
      },
    },
    build: {
      outDir: isEmbeddedBuild ? '../public/kalingalink' : 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
  };
});
