import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'

  return {
    base,
    plugins: [react()],
  }
})
