import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './accent.css' // Import explicit accent styles
import App from './App.jsx'
import Admin from './Admin.jsx'
import Login from './Login.jsx'
import NotFound from './NotFound.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import './toggleTheme.js' // Import theme toggle utility for debugging
import './themeDebug.js' // Import additional theme debugging tools
import { ThemeProvider } from './components/ThemeProvider'; // Import the ThemeProvider
import { initAntiDevTools } from '../utils/antiDevTools.js'; // Import anti-devtools utilities
// import NavBar from './components/NavBar.jsx'

// Ensure light theme is initialized before rendering
const initializeTheme = () => {
  // Always use light mode
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  localStorage.setItem('theme', 'light');
  
  console.log('Light mode initialized from main.jsx (dark mode disabled)');
};

// Run immediately
initializeTheme();

// Set up router
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ThemeProvider>
        
        <App />
      </ThemeProvider>
    )
  },
  {
    path: '/login',
    element: (
      <ThemeProvider>
        
        <Login />
      </ThemeProvider>
    )
  },
  {
    path: '/admin',
    element: (
      <ThemeProvider>
        <RequireAuth>
         
          <Admin />
        </RequireAuth>
      </ThemeProvider>
    )
  },
  {
    // 404 catch-all route
    path: '*',
    element: (
      <ThemeProvider>
        <NotFound />
      </ThemeProvider>
    )
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

// Initialize simplified anti-devtools protections
// In production builds, this will be active automatically
// For testing in development, we're forcing it to be enabled
initAntiDevTools({
  disableRightClick: true, // Block all right-clicks sitewide
  disableKeyboardShortcuts: true, // Only blocks developer tool shortcuts
  forceEnable: true, // Force enable for pre-production testing
  onDevToolsOpen: () => {
    // Security event logging
    try {
      // Log to server
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
      }).catch(() => {}); // Silent fail
    } catch (e) {
      // Ignore errors
    }
  },
  onTamperAttempt: (details) => {
    // Log tampering attempts
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
      }).catch(() => {}); // Silent fail
    } catch (e) {
      // Ignore errors
    }
  }
});
