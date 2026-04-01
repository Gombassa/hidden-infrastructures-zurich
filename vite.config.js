import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  assetsInclude: ['**/*.wasm', '**/*.pd'],
  publicDir: 'public',
});
