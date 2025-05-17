/**
 * Utility functions for authentication and authorization
 */

/**
 * Check if a user is authenticated based on session storage or localStorage
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export function isAuthenticated() {
  // First check sessionStorage (for current session)
  const isAuthSession = sessionStorage.getItem('isAuthenticated') === 'true';
  
  if (isAuthSession) {
    return true;
  }
  
  // If not authenticated in current session, check for persistent auth
  return checkPersistentAuth();
}

/**
 * Check for persistent authentication in localStorage
 * @returns {boolean} True if persistently authenticated
 */
function checkPersistentAuth() {
  const isPersistentAuth = localStorage.getItem('isAuthenticatedPersistent') === 'true';
  
  if (isPersistentAuth) {
    // Check if device identifier matches for extra security
    const storedDeviceId = localStorage.getItem('deviceIdentifier');
    const currentDeviceId = generateDeviceId();
    
    // Basic similarity check - in a real app you'd use a more robust comparison
    if (storedDeviceId && storedDeviceId !== currentDeviceId) {
      console.warn('Device fingerprint mismatch - possible security concern');
      // Consider adding further security measures here, like requiring re-login
      // For now, we'll allow it but log the warning
    }
    
    // If persistently authenticated, set up the current session too
    sessionStorage.setItem('isAuthenticated', 'true');
    return true;
  }
  
  return false;
}

/**
 * Set the user as authenticated
 * @param {boolean} rememberMe - Whether to remember the user across browser sessions
 * @returns {void}
 */
export function login(rememberMe = false) {
  // Always set session authentication
  sessionStorage.setItem('isAuthenticated', 'true');
  
  // If remember me is checked, also set persistent authentication
  if (rememberMe) {
    localStorage.setItem('isAuthenticatedPersistent', 'true');
    
    // Generate and store a device identifier for enhanced security
    const deviceId = generateDeviceId();
    localStorage.setItem('deviceIdentifier', deviceId);
    
    console.log('Remember Me enabled with device fingerprinting');
  }
}

/**
 * Log out the current user by removing authentication data
 * @returns {void}
 */
export function logout() {
  // Clear both session and persistent authentication
  sessionStorage.removeItem('isAuthenticated');
  localStorage.removeItem('isAuthenticatedPersistent');
  localStorage.removeItem('deviceIdentifier');
}

/**
 * Generate a unique device identifier based on browser and system information
 * This helps make the "Remember Me" functionality more secure
 * @returns {string} A unique device identifier
 */
function generateDeviceId() {
  const components = [
    navigator.userAgent,
    navigator.language,
    window.screen.colorDepth,
    `${window.screen.width}x${window.screen.height}`,
    new Date().getTimezoneOffset(),
    // Add more entropy with system capabilities
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
    navigator.platform || 'unknown'
  ];
  
  // Create a hash of the components
  let hash = 0;
  const combinedStr = components.join('|');
  
  for (let i = 0; i < combinedStr.length; i++) {
    const char = combinedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return 'device_' + Math.abs(hash).toString(36) + Date.now().toString(36);
}

/**
 * Get device identifier for the current device
 * @returns {string|null} The device identifier or null if not available
 */
export function getDeviceIdentifier() {
  return localStorage.getItem('deviceIdentifier');
}
