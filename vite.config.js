import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base avoids broken asset URLs on GitHub Pages when repo names differ.
export default defineConfig({
  plugins: [react()],
  base: './',
});
