// server.js - Express.js backend for Scraper app
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { scrapeData, saveToCSV } from './src/utils/scraperService.js';
import proxyManager from './src/utils/proxyManager.js';
import { adminCredentials } from './src/config/auth.js';
import { registerActiveSession, deregisterActiveSession, stopScraping, getActiveSessions } from './src/utils/sessionManager.js';
import { getSettings, saveSettings, updateSetting, getSetting } from './src/config/appSettings.js';

// Load environment variables from .env file
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map to store client connections for SSE with session IDs
const clients = new Map();

// Map to store session activity timestamps
const sessionActivity = new Map();

// Helper function to generate a unique session ID
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Function to clean up inactive sessions (run every 5 minutes)
function cleanupInactiveSessions() {
  const now = Date.now();
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  sessionActivity.forEach((lastActive, sessionId) => {
    if (now - lastActive > SESSION_TIMEOUT) {
      // Close and remove inactive client connections
      const client = clients.get(sessionId);
      if (client) {
        try {
          client.end(); // End the SSE connection
        } catch (e) {
          console.error(`Error closing SSE connection for session ${sessionId}:`, e);
        }
        clients.delete(sessionId);
      }
      sessionActivity.delete(sessionId);
      console.log(`Cleaned up inactive session: ${sessionId}`);
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3001; // Using port 3001 to avoid conflicts

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com', 'http://localhost:3001'] : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  // In development, allow unauthenticated access for easier testing
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Check for authorization header in the format "Bearer authenticated"
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Allow access if either authentication method is valid
  if (
    (authHeader && authHeader.startsWith('Bearer authenticated')) || 
    (apiKey && apiKey === process.env.ADMIN_API_KEY)
  ) {
    return next();
  }
  
  // Unauthorized if neither method is valid
  return res.status(401).json({ 
    success: false, 
    error: 'Unauthorized. Please log in to access this feature.' 
  });
};

// SSE endpoint for progress updates
app.get('/api/progress-events/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send an initial message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);
  
  // Add this client to the connected clients map with their session ID
  clients.set(sessionId, res);
  
  // Update session activity timestamp
  sessionActivity.set(sessionId, Date.now());
  
  // Handle client disconnect
  req.on('close', () => {
    clients.delete(sessionId);
    console.log(`Client disconnected: ${sessionId}`);
  });
});

// Function to send SSE updates to all connected clients
function sendSSEUpdate(data) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Function to send SSE updates to a specific client by session ID
function sendSSEUpdateToSession(sessionId, data) {
  const client = clients.get(sessionId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
    // Update session activity timestamp
    sessionActivity.set(sessionId, Date.now());
  }
}

// API Endpoints
app.post('/api/scrape', async (req, res) => {
  // Generate a unique session ID for this scraping request
  const sessionId = generateSessionId();
  
  try {
    const { mcNumbers, format, includeNotAuthorized } = req.body;
    
    // Get admin settings for limits
    const concurrencyLimit = getSetting('concurrencyLimit');
    const maxRecordsPerScrape = getSetting('maxRecordsPerScrape');
    
    // Validate that the number of records doesn't exceed the limit
    if (mcNumbers.length > maxRecordsPerScrape) {
      return res.status(400).json({
        success: false,
        error: `Number of records (${mcNumbers.length}) exceeds the maximum allowed (${maxRecordsPerScrape})`
      });
    }
    
    console.log(`Starting scrape with session ${sessionId}, concurrencyLimit: ${concurrencyLimit} (admin-controlled)`);
    
    // Create a function to handle progress updates and send via SSE to this specific session
    const progressCallback = (data) => {
      // Send progress update through SSE only to this session
      sendSSEUpdateToSession(sessionId, data);
    };
    
    // Send initial response with session ID so client can connect
    res.json({ 
      success: true, 
      sessionId,
      message: 'Scraping started',
      totalRecords: mcNumbers.length,
      totalBatches: Math.ceil(mcNumbers.length / concurrencyLimit),
      concurrencyLimit // Send the admin-set concurrency limit to the client
    });
    
    // Send initial update through SSE once connected
    setTimeout(() => {
      sendSSEUpdateToSession(sessionId, {
        type: 'init',
        totalRecords: mcNumbers.length,
        totalBatches: Math.ceil(mcNumbers.length / concurrencyLimit),
        concurrencyLimit, // Include concurrency limit in the SSE update
        message: 'Starting scraping process'
      });
    }, 100); // Small delay to allow client to connect to SSE
    
    // Start scraping - dynamically import getProxies
    const { getProxies } = await import('./src/config/proxy.js');
    const results = await scrapeData(mcNumbers, format, progressCallback, {
      includeNotAuthorized,
      concurrencyLimit,
      proxies: getProxies(), // Pass the proxies from config
      sessionId // Pass the session ID so scrapeData can register for stop events
    });
    
    // Send completion update to this session
    sendSSEUpdateToSession(sessionId, {
      type: 'complete',
      message: results.length > 0 ? 'Scraping completed' : 'No records found',
      results
    });
    
    // Results were already sent in the initial response
  } catch (error) {
    console.error(`Scraping error in session ${sessionId}:`, error);
    
    // Send error update via SSE to this specific session
    sendSSEUpdateToSession(sessionId, {
      type: 'error',
      message: error.message,
      fatal: true
    });
    
    // No need to send error response as we've already sent the initial response with sessionId
  }
});

// Endpoint to stop an active scraping session
app.post('/api/stop-scrape', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required'
    });
  }
  
  try {
    // Attempt to stop the scraping process
    const stopped = stopScraping(sessionId);
    
    if (stopped) {
      // Notify client via SSE that the scrape has been stopped manually
      sendSSEUpdateToSession(sessionId, {
        type: 'manualStop',
        message: 'Scraping stopped by user request'
      });
      
      return res.json({
        success: true,
        message: 'Scraping process stopped successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'No active scraping session found with the provided ID'
      });
    }
  } catch (error) {
    console.error(`Error stopping scrape session ${sessionId}:`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to stop scraping: ${error.message}`
    });
  }
});

app.post('/api/save-csv', async (req, res) => {
  try {
    const { data, sessionId } = req.body;
    const result = await saveToCSV(data);
    
    // For web, we'll return the CSV data for download
    if (result.csvData) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName || 'scraped_data.csv'}"`);
      res.send(result.csvData);
    } else {
      res.json({ success: true, filePath: result.filePath });
    }
    
    // If session ID is provided, send a success message
    if (sessionId) {
      sendSSEUpdateToSession(sessionId, {
        type: 'csvSaved',
        message: 'CSV file saved successfully',
        fileName: result.fileName || 'scraped_data.csv'
      });
    }
  } catch (error) {
    console.error('CSV save error:', error);
    
    // Send error via SSE if sessionId is available
    if (req.body.sessionId) {
      sendSSEUpdateToSession(req.body.sessionId, {
        type: 'error',
        message: `Failed to save CSV: ${error.message}`
      });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin settings endpoints (protected by authentication)
app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = getSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error retrieving admin settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while retrieving admin settings'
    });
  }
});

app.post('/api/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings object'
      });
    }
    
    // Validate concurrencyLimit if it exists
    if (settings.concurrencyLimit !== undefined) {
      const concurrencyLimit = parseInt(settings.concurrencyLimit);
      if (isNaN(concurrencyLimit) || concurrencyLimit < 1 || concurrencyLimit > 20) {
        return res.status(400).json({
          success: false,
          error: 'Concurrency limit must be between 1 and 20'
        });
      }
    }
    
    // Save the settings
    const saved = saveSettings(settings);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: getSettings() // Return the current settings
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save settings'
      });
    }
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while updating admin settings'
    });
  }
});

// Proxy management endpoints (protected by authentication)
app.get('/api/proxy/status', authenticateAdmin, async (req, res) => {
  try {
    // Get storage info
    // Use import instead of require - node 'require' is not available in ESM
    const proxiesStoragePath = path.join(process.cwd(), 'proxies.json');
    const legacyProxiesFilePath = path.join(process.cwd(), 'proxieslist.txt');
    
    // Import fs module
    const fs = await import('fs');
    
    let storageInfo = {
      jsonStorage: {
        exists: fs.existsSync(proxiesStoragePath),
        lastModified: fs.existsSync(proxiesStoragePath) ? 
          new Date(fs.statSync(proxiesStoragePath).mtime).toISOString() : null
      },
      legacyStorage: {
        exists: fs.existsSync(legacyProxiesFilePath),
        lastModified: fs.existsSync(legacyProxiesFilePath) ? 
          new Date(fs.statSync(legacyProxiesFilePath).mtime).toISOString() : null
      }
    };
    
    // Dynamically import getProxies
    const { getProxies } = await import('./src/config/proxy.js');
    
    // Return proxy status
    res.json({
      success: true,
      stats: proxyManager.getStats(),
      configuredProxies: getProxies(),
      storage: storageInfo
    });
  } catch (error) {
    console.error('Error in proxy status endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred while getting proxy status'
    });
  }
});

app.post('/api/proxy/configure', authenticateAdmin, async (req, res) => {
  const { proxies } = req.body;
  
  if (!proxies || !Array.isArray(proxies)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid proxies format. Expected an array of proxy strings.' 
    });
  }
  
  try {
    // Set the proxies in the proxy manager
    proxyManager.setProxies(proxies);
    
    // Save proxies to persistent storage with current index
    const { saveProxies } = await import('./src/config/proxy.js');
    const saved = saveProxies(proxies, proxyManager.getCurrentProxyIndex());
    
    // Run a health check
    proxyManager.healthCheckAllProxies().catch(err => {
      console.warn(`Proxy health check failed: ${err.message}`);
    });
    
    res.json({ 
      success: true, 
      message: `Configured ${proxies.length} proxies${saved ? ' and saved to storage' : ''}.`,
      stats: proxyManager.getStats()
    });
  } catch (error) {
    console.error('Error configuring proxies:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred while configuring proxies'
    });
  }
});

// New endpoint to delete proxies
app.post('/api/proxy/delete', authenticateAdmin, async (req, res) => {
  const { indexes } = req.body;
  
  if (!indexes || !Array.isArray(indexes)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid indexes format. Expected an array of proxy indexes to delete.' 
    });
  }
  
  try {
    // Import the deleteProxies function dynamically
    const { deleteProxies, getProxies } = await import('./src/config/proxy.js');
    
    // Delete the specified proxies
    const result = await deleteProxies(indexes);
    
    if (result.success) {
      // Update proxies in the proxy manager
      proxyManager.setProxies(result.proxies);
      
      // Return success response with updated proxy stats
      res.json({ 
        success: true, 
        message: `Deleted ${result.deleted} proxies. ${result.remaining} proxies remaining.`,
        stats: proxyManager.getStats(),
        configuredProxies: getProxies()
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to delete proxies.' 
      });
    }
  } catch (error) {
    console.error('Error deleting proxies:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/proxy/rotate', authenticateAdmin, async (req, res) => {
  try {
    // Force rotate to next proxy
    const newProxy = proxyManager.rotateProxy(true);
    
    // Save the updated configuration to ensure the current proxy index is maintained across restarts
    const currentProxies = proxyManager.getAllProxies();
    if (currentProxies.length > 0) {
      // Import saveProxies dynamically to avoid circular dependencies
      const { saveProxies } = await import('./src/config/proxy.js');
      const saved = saveProxies(currentProxies, proxyManager.getCurrentProxyIndex());
      
      if (!saved) {
        console.warn('Failed to save proxies after rotation');
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Rotated to next proxy',
      currentProxy: newProxy,
      stats: proxyManager.getStats()
    });
  } catch (error) {
    console.error('Error rotating proxy:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred while rotating proxy'
    });
  }
});

// Serve the frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Authentication endpoint for admin login
app.post('/api/auth/login', (req, res) => {
  const { username, password, rememberMe, deviceInfo } = req.body;
  
  // Check credentials
  if (username === adminCredentials.username && password === adminCredentials.password) {
    // Log device info for security monitoring (in a real app, you'd store this)
    if (rememberMe && deviceInfo) {
      console.log(`Admin login with "Remember Me" from device: ${JSON.stringify(deviceInfo)}`);
    }
    
    // Successful login
    res.json({
      success: true,
      message: 'Authentication successful',
      rememberMe: !!rememberMe,
    });
  } else {
    // Failed login
    res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    // Dynamically import the getProxies function
    const { getProxies } = await import('./src/config/proxy.js');
    
    // Initialize proxy manager with proxies from config or environment
    const proxies = getProxies();
    if (proxies && proxies.length > 0) {
      proxyManager.setProxies(proxies);
      console.log(`Initialized proxy manager with ${proxies.length} proxies.`);
      
      // Run health check on all proxies
      proxyManager.healthCheckAllProxies().catch(err => {
        console.warn(`Initial proxy health check failed: ${err.message}`);
      });
    } else {
      console.log('No proxies configured. Using direct connections.');
    }
  } catch (error) {
    console.error('Error initializing proxy manager:', error);
  }
  
  // Set up regular cleanup of inactive sessions
  setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // Run every 5 minutes
});
