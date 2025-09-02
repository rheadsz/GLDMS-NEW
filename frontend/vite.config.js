import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    },
    allowedHosts: ['f36414441de3.ngrok-free.app', '.ngrok-free.app']
  }
})
