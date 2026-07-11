import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Resolve the shared SDK straight from source so the build compiles it too.
const sdkSrc = fileURLToPath(new URL('../../packages/sdk/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@emergencyai/sdk': sdkSrc },
  },
  server: { port: 5173 },
});
