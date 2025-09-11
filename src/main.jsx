import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker, handleInstallPrompt, handleOnlineOffline } from './utils/pwa.js'
import './i18n'

// Initialize PWA features
registerServiceWorker()
handleInstallPrompt()
handleOnlineOffline()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
