import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR off by default in this sandbox so only Express :3000 is exposed.
      // A stray :24678 HMR port causes Arena preview "Upgrade Required".
      hmr: false,
      watch: null,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});
