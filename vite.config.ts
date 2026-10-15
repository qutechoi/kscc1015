/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/kscc1015/',
  plugins: [react()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
