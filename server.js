// server.js - Express.js backend for Scraper app
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { scrapeData, saveToCSV } from './src/utils/scraperService.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map to store client connections for SSE
const clients = new Map();

const app = express();
const PORT = process.env.PORT || 3000; // Using port 3000

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com', 'http://localhost:3000'] : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// SSE endpoint for progress updates
app.get('/api/progress-events', (req, res) => {
  const clientId = Date.now();
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send an initial message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  // Add this client to the connected clients map
  clients.set(clientId, res);
  
  // Handle client disconnect
  req.on('close', () => {
    clients.delete(clientId);
  });
});

// Function to send SSE updates to all connected clients
function sendSSEUpdate(data) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// API Endpoints
app.post('/api/scrape', async (req, res) => {
  try {
    const { mcNumbers, format, includeNotAuthorized, concurrencyLimit } = req.body;
    
    console.log(`Starting scrape with concurrencyLimit: ${concurrencyLimit} (${typeof concurrencyLimit})`);
    
    // Create a function to handle progress updates and send via SSE
    const progressCallback = (data) => {
      // Send progress update through SSE
      sendSSEUpdate(data);
    };
    
    // Send initial update
    sendSSEUpdate({
      type: 'init',
      totalRecords: mcNumbers.length,
      totalBatches: Math.ceil(mcNumbers.length / concurrencyLimit),
      message: 'Starting scraping process'
    });
    
    // Start scraping
    const results = await scrapeData(mcNumbers, format, progressCallback, {
      includeNotAuthorized,
      concurrencyLimit
    });
    
    // Send completion update
    sendSSEUpdate({
      type: 'complete',
      message: results.length > 0 ? 'Scraping completed' : 'No records found',
      results
    });
    
    // Always return results even if we stopped early due to geo-restriction
    res.json({ success: true, results });
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Send error update via SSE
    sendSSEUpdate({
      type: 'error',
      message: error.message
    });
    
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/save-csv', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await saveToCSV(data);
    
    // For web, we'll return the CSV data for download
    if (result.csvData) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName || 'scraped_data.csv'}"`);
      res.send(result.csvData);
    } else {
      res.json({ success: true, filePath: result.filePath });
    }
  } catch (error) {
    console.error('CSV save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
