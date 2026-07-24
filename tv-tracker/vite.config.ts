import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Change '/family-dashboard/' if your GitHub repo has a different name
const REPO = 'family-dashboard';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || `/${REPO}/tv/`,
  server: { port: 5174 },
});
