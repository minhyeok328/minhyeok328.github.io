import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createRootFallbackPlugin } from './build/rootFallback.ts'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    createRootFallbackPlugin(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
