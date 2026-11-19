import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './styles/index.css'
import App from './App.tsx'
import { UpdateBanner } from './components/ui/UpdateBanner'
import { startPwa } from './lib/pwa'

startPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateBanner />
  </StrictMode>,
)
