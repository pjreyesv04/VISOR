import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/supabase-proxy': {
        target: 'https://coxrhjgmjokqyjhmmhfx.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        ws: true,
      },
    },
  },
})
