import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { loadPrefs, applyPrefs } from './lib/storage/prefs'

// Apply UI preferences (accent, motion, contrast) before first paint.
applyPrefs(loadPrefs())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
