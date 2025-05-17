import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './accent.css' // Import explicit accent styles
import App from './App.jsx'
import Admin from './Admin.jsx'
import Login from './Login.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import './toggleTheme.js' // Import theme toggle utility for debugging
import './themeDebug.js' // Import additional theme debugging tools
import { ThemeProvider } from './components/ThemeProvider'; // Import the ThemeProvider

// Ensure theme is initialized before rendering
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
  
  console.log('Theme initialized from main.jsx:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
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
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
