import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./typed-src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    include: ['typed-src/**/*.test.ts']
  }
});
