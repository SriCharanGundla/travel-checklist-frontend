import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import AnimationProviders from './providers/AnimationProviders.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AnimationProviders>
        <App />
      </AnimationProviders>
    </ThemeProvider>
  </React.StrictMode>,
)
