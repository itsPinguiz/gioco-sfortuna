import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ==========================================
// APPLICATION ENTRY POINT
// ==========================================

/**
 * Main application entry point
 * Renders the App component with React StrictMode for development checks
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
