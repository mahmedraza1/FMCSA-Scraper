// filepath: /home/mark/Scraper/src/config/proxy.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import proxyManager from '../utils/proxyManager.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to proxies JSON storage file 
const proxiesStoragePath = path.join(process.cwd(), 'proxies.json');
console.log('Proxies JSON storage path:', proxiesStoragePath);

// Legacy text file path (for backwards compatibility)
const legacyProxiesFilePath = path.join(process.cwd(), 'proxieslist.txt');

/**
 * Save proxies to JSON storage file
 * @param {Array} proxies - Array of proxy strings
 * @param {number} currentIndex - Current proxy index (optional)
 */
export function saveProxies(proxies, currentIndex = 0) {
  try {
    console.log('Saving proxies to:', proxiesStoragePath);
    console.log('Current working directory:', process.cwd());
    
    fs.writeFileSync(proxiesStoragePath, JSON.stringify({
      updatedAt: new Date().toISOString(),
      proxies: proxies,
      currentIndex: currentIndex
    }, null, 2));
    console.log(`Saved ${proxies.length} proxies to storage with currentIndex ${currentIndex}`);
    return true;
  } catch (error) {
    console.error(`Failed to save proxies to storage: ${error.message}`);
    return false;
  }
}

/**
 * Get proxies from storage
 * First tries the JSON storage file, falls back to legacy text file if needed
 * @returns {Object} Object containing array of proxy strings and current index
 */
export function getProxies() {
  // Try to load from JSON storage first
  console.log('Checking for proxies.json at:', proxiesStoragePath);
  console.log('File exists?', fs.existsSync(proxiesStoragePath));
  
  if (fs.existsSync(proxiesStoragePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(proxiesStoragePath, 'utf8'));
      if (Array.isArray(data.proxies)) {
        console.log(`Loaded ${data.proxies.length} proxies from JSON storage`);
        
        // If the file contains a currentIndex, use it to set the proxy index
        if (data.currentIndex !== undefined && 
            typeof data.currentIndex === 'number' && 
            proxyManager && 
            typeof proxyManager.setCurrentProxyIndex === 'function') {
          // We pass this to the proxy manager
          setTimeout(() => {
            proxyManager.setCurrentProxyIndex(data.currentIndex);
          }, 500); // Slight delay to ensure proxy manager is fully initialized
        }
        
        return data.proxies;
      }
    } catch (error) {
      console.error(`Error loading proxies from JSON storage: ${error.message}`);
    }
  }

  // Fall back to legacy text file if JSON storage doesn't exist or is invalid
  if (fs.existsSync(legacyProxiesFilePath)) {
    console.log('Using legacy proxies list file as fallback');
    return parseProxiesFromFile();
  }

  console.warn('No proxy storage found. Using empty proxy list.');
  return [];
}

/**
 * Parse the proxies from the legacy proxieslist.txt file
 * The format in the file is:
 * IP/hostname  login: username  Password: password  SOCKS5: port  HTTP/S: port
 * Or country names and IP addresses
 */
function parseProxiesFromFile() {
  try {
    if (!fs.existsSync(legacyProxiesFilePath)) {
      console.warn(`Legacy proxies file not found at ${legacyProxiesFilePath}`);
      return [];
    }

    const content = fs.readFileSync(legacyProxiesFilePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));
    
    const proxies = [];
    
    for (const line of lines) {
      // Basic proxy formats detection
      if (line.includes('http://') || line.includes('https://') || line.includes('socks')) {
        proxies.push(line.trim());
        continue;
      }

      // IP:port format
      const ipPortMatch = line.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
      if (ipPortMatch) {
        proxies.push(`http://${ipPortMatch[1]}:${ipPortMatch[2]}`);
        continue;
      }
      
      // Format with login and password details
      const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/);
      const loginMatch = line.match(/login:\s*([^\s]+)/i);
      const passwordMatch = line.match(/password:\s*([^\s]+)/i);
      const socksMatch = line.match(/socks5:\s*(\d+)/i);
      const httpMatch = line.match(/https?:\s*(\d+)/i);
      
      if (ipMatch) {
        const ip = ipMatch[1];
        const username = loginMatch ? loginMatch[1] : null;
        const password = passwordMatch ? passwordMatch[1] : null;
        
        if (socksMatch) {
          const port = socksMatch[1];
          const proxy = username && password 
            ? `socks5://${username}:${password}@${ip}:${port}`
            : `socks5://${ip}:${port}`;
          proxies.push(proxy);
        }
        
        if (httpMatch) {
          const port = httpMatch[1];
          const proxy = username && password 
            ? `http://${username}:${password}@${ip}:${port}`
            : `http://${ip}:${port}`;
          proxies.push(proxy);
        }
      }
    }
    
    console.log(`Parsed ${proxies.length} proxies from legacy file`);
    
    // Save to the new JSON format for future use
    if (proxies.length > 0) {
      saveProxies(proxies);
    }
    
    return proxies;
  } catch (error) {
    console.error(`Error parsing proxies from file: ${error.message}`);
    return [];
  }
}

/**
 * Delete proxies from storage
 * @param {Array} indexesToDelete - Array of indexes to delete
 * @returns {Object} Object with success status and updated proxies list
 */
export async function deleteProxies(indexesToDelete) {
  try {
    // Dynamically import the proxyManager for current index
    const proxyManagerModule = await import('../utils/proxyManager.js');
    const proxyManager = proxyManagerModule.default;
    
    let proxies = getProxies();
    const originalLength = proxies.length;
    
    // Filter out the proxies to delete
    if (Array.isArray(indexesToDelete) && indexesToDelete.length > 0) {
      // Sort indexes in descending order to avoid index shifting problems
      const sortedIndexes = [...indexesToDelete].sort((a, b) => b - a);
      
      // Remove each proxy by index
      for (const index of sortedIndexes) {
        if (index >= 0 && index < proxies.length) {
          proxies.splice(index, 1);
        }
      }
    }
    
    // Get current index from proxy manager
    const currentIndex = (proxyManager && typeof proxyManager.getCurrentProxyIndex === 'function') 
      ? proxyManager.getCurrentProxyIndex() 
      : 0;
    
    // Adjust current index if necessary
    const newIndex = (currentIndex >= proxies.length) ? (proxies.length > 0 ? 0 : -1) : currentIndex;
    
    // Save the updated list
    const saved = saveProxies(proxies, newIndex);
    
    return {
      success: saved,
      deleted: originalLength - proxies.length,
      remaining: proxies.length,
      proxies: proxies
    };
  } catch (error) {
    console.error(`Error deleting proxies: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
