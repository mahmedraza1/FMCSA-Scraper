// filepath: /home/mark/Scraper/src/ui/components/RequireAuth.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * A component that requires authentication to access protected routes.
 * If the user is not authenticated, they will be redirected to the login page.
 */
function RequireAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  
  // Check for authentication status when the component renders
  useEffect(() => {
    // Check if user is authenticated
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    if (!authStatus) {
      // Redirect to login page with the intended location
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [navigate, location]);
  
  // If authenticated, render the children
  return authenticated ? children : null;
}

export default RequireAuth;
