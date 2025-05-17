import { logout } from './auth';

/**
 * Simplified session management utility without timeout functionality
 * Maintains just basic session handling
 */
class SessionManager {
  constructor() {
    this.logoutListeners = [];
  }

  /**
   * Initialize the session manager
   */
  init() {
    // Basic initialization - nothing to do in simplified version
    console.log('Session manager initialized');
  }

  /**
   * Handle explicit logout
   */
  performLogout() {
    // Perform logout
    logout();
    
    // Notify listeners
    this.notifyLogout();
  }

  /**
   * Add listener for logout events
   */
  onLogout(callback) {
    this.logoutListeners.push(callback);
    return this;
  }

  /**
   * Notify all logout listeners
   */
  notifyLogout() {
    this.logoutListeners.forEach(callback => callback());
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // No resources to clean up in simplified version
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
