import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './index.scss'
import App from './App.jsx'
import AppErrorBoundary from './app/components/AppErrorBoundary.jsx'
import { initializeThemes } from './lib/themes/store.js'
import { finishBootLoading } from './bootLoader.js'
import { useEffect } from 'react'
function BootReady(){useEffect(finishBootLoading,[]);return null;}

const cleanupThemes = initializeThemes();
if (import.meta.hot) import.meta.hot.dispose(cleanupThemes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
    <BootReady />
  </StrictMode>,
)
