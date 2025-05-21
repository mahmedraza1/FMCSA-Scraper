/**
 * Client-side environment variables with defaults
 */

// Determine the base URL for API
function getApiBaseUrl() {
  // First check for environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // If not available, dynamically build based on current location
  // This ensures the API routes point to the same domain as the application in production
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // Use port 3001 for local development, otherwise use the same port as the UI
  const port = hostname === 'localhost' ? '3001' : window.location.port;
  
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
}

// API URL
export const API_URL = getApiBaseUrl();
