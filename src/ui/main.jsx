import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './accent.css' 
import App from './App.jsx'
import Admin from './Admin.jsx'
import Login from './Login.jsx'
import NotFound from './NotFound.jsx'
import RequireAuth from './components/RequireAuth.jsx'

import { initAntiDevTools } from '../utils/antiDevTools.js'; 



const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <Admin />
      </RequireAuth>
    )
  },
  {
    
    path: '*',
    element: <NotFound />
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)




initAntiDevTools({
  disableRightClick: true, 
  disableKeyboardShortcuts: true, 
  forceEnable: true, 
  onDevToolsOpen: () => {
    
    try {
      
      fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'devtools_shortcut_blocked',
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }),
      }).catch(() => {}); 
    } catch (e) {
      
    }
  },
  onTamperAttempt: (details) => {
    
    try {
      fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'security_tamper_attempt',
          details: details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }),
      }).catch(() => {}); 
    } catch (e) {
      
    }
  }
});
