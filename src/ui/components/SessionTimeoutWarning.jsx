import { useState, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';
import { updateLastActivity } from '../utils/auth';

/**
 * Component that displays a warning when a user's session is about to expire
 * and provides an option to extend the session.
 */
function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    // Set up warning handler
    sessionManager.onTimeoutWarning((seconds) => {
      setTimeRemaining(seconds);
      setShowWarning(true);
    });
    
    // Handle activity events to hide warning
    sessionManager.onActivity(() => {
      // Hide warning if shown when user becomes active
      if (showWarning) {
        setShowWarning(false);
      }
    });
    
    // Handle logout event
    sessionManager.onLogout(() => {
      setShowWarning(false);
    });
    
    // Initialize session manager
    sessionManager.init();
    
    // Cleanup on unmount
    return () => {
      sessionManager.cleanup();
    };
  }, []);
  
  // Update the session when user clicks "Stay Logged In"
  const handleExtendSession = () => {
    updateLastActivity();
    setShowWarning(false);
  };
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed inset-x-0 bottom-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:px-0 sm:pb-0 z-50 transition-all">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      <div className="relative bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Session Timeout Warning
            </h3>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your session will expire in {Math.floor(timeRemaining / 60)} minutes and {timeRemaining % 60} seconds due to inactivity. 
                Would you like to stay logged in?
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-accent text-base font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent sm:col-start-2 sm:text-sm"
            onClick={handleExtendSession}
          >
            Stay Logged In
          </button>
          
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent sm:mt-0 sm:col-start-1 sm:text-sm"
            onClick={() => setShowWarning(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionTimeoutWarning;
