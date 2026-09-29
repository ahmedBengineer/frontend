import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, '.'),
    },
  },
  test: {
    projects: [
      {
        // Unit tests for pure utilities
        test: {
          name: 'unit',
          include: ['**/__tests__/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
