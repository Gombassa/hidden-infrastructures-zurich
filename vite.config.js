import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    headers: {
      // Required for AudioWorklet + SharedArrayBuffer
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  assetsInclude: ['**/*.wasm', '**/*.pd'],
});
