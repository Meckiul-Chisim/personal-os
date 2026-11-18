import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// A new id for every build. The app compares it with /version.json to notice when a newer version is deployed.
const buildId = new Date().toISOString()

const versionFile = (): Plugin => ({
  name: 'personal-os-version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: buildId }) })
  },
})

export default defineConfig({
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
