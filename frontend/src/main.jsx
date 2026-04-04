import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './contexts/LanguageContext'
import { AppSettingsProvider } from './contexts/AppSettingsContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <LanguageProvider>
        <AppSettingsProvider>
          <App />
        </AppSettingsProvider>
      </LanguageProvider>
    </StrictMode>
  </BrowserRouter>
)
