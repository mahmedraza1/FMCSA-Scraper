// Global map to track active scraping processes by session ID
const activeScrapeSessions = new Map();

// Register a scraping process as active
export function registerActiveSession(sessionId, stopHandler) {
  activeScrapeSessions.set(sessionId, {
    stopHandler,
    startTime: Date.now()
  });
  
}

// Deregister a scraping process
export function deregisterActiveSession(sessionId) {
  activeScrapeSessions.delete(sessionId);
  
}

// Stop a scraping process
export function stopScraping(sessionId) {
  const session = activeScrapeSessions.get(sessionId);
  if (session && typeof session.stopHandler === 'function') {
    session.stopHandler();
    
    return true;
  }
  return false;
}

// Get all active scraping sessions (for debugging)
export function getActiveSessions() {
  const sessions = [];
  activeScrapeSessions.forEach((session, sessionId) => {
    sessions.push({
      sessionId,
      duration: Math.round((Date.now() - session.startTime) / 1000)
    });
  });
  return sessions;
}
