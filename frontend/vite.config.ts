import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Deux pages : envoi (/) et cadre (/frame.html)
  input: ['index.html', 'frame.html'],
  server: {
    // Écoute sur le réseau local pour tester depuis un smartphone
    host: true,
    // Même origine pour le navigateur : pas de CORS à configurer en local
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'ws://localhost:3000', ws: true },
    },
  },
})
