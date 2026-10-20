import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,
  test: {
    globals: true,
    root: rootDir,
    include: ['**/*.spec.ts'],
  },
});
