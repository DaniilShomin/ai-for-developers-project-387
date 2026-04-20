import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get values from env or use defaults
  const frontendPort = parseInt(env.VITE_FRONTEND_PORT || '3000')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    define: {
      // MSW enabled only via explicit env variable, not in dev mode by default
      'import.meta.env.VITE_ENABLE_MSW': JSON.stringify(env.VITE_ENABLE_MSW === 'true'),
    },
  }
})
