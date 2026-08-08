import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createProjectRouteEntriesPlugin } from './build/projectRouteEntries'
import { portfolioData } from './src/data/portfolio'
import { getOrderedProjects } from './src/lib/projects'

const projects = getOrderedProjects(portfolioData)

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    createProjectRouteEntriesPlugin(projects, portfolioData.profile),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
