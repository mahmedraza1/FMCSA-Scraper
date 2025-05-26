import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { parse } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import proxyManager from './proxyManager.js';
import { getProxies } from '../config/proxy.js';

// Function to extract company data from the HTML
function extractCompanyData(html) {
  const $ = cheerio.load(html);
  const hasMainTable = $('th:contains("Entity Type")').length > 0;

  if (!hasMainTable) {
    return { error: 'Record not found' };
  }

  const data = {};

  $('tr').each((_, row) => {
    const th = $(row).find('th').first().text().trim();
    const tds = $(row).find('td');

    const value = tds.first().text().trim();

    if (th.includes('Entity Type')) data['Entity Type'] = value;
    if (th.includes('MC/MX/FF Number')) data['MC/MX/FF Number(s)'] = value;
    if (th.includes('Legal Name')) data['Legal Name'] = value;
    if (th.includes('Physical Address')) {
      data['Physical Address'] = value.replace(/\s+/g, ' ').trim();
    }
    if (th.includes('Phone')) data['Phone'] = value;
    if (th.includes('Operating Authority Status')) {
      data['Operating Authority Status'] = value.replace(/For Licensing.*$/i, '').trim();
      data['Operating Authority Status'] = data['Operating Authority Status'].replace(/\s+/g, ' ').trim();
    }
    if (th.includes('Power Units')) {
      data['Power Units'] = tds.eq(0).text().trim();
      data['Drivers'] = tds.eq(1).text().trim();
    }
  });
  return data;
}

// Function to fetch HTML for a given MC number
async function fetchMCHtml(MCNumber) {
  const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${MCNumber}`;
  try {
    // Check if we have proxies available
    if (proxyManager.proxies.length > 0) {
      // Use fetchWithProxy which handles rotation and retries
      const res = await proxyManager.fetchWithProxy(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      if (res.status === 403) {
        throw new Error('ACCESS_FORBIDDEN');
      }
      
      if (!res.ok) {
        return null;
      }
      
      return await res.text();
    } else {
      // No proxies, use direct connection
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      if (res.status === 403) {
        throw new Error('ACCESS_FORBIDDEN');
      }
      
      if (!res.ok) {
        return null;
      }
      
      return await res.text();
    }
  } catch (error) {
    if (error.message === 'ACCESS_FORBIDDEN') {
      throw error; // Re-throw the error to be caught by the caller
    }
    // Network errors (like disconnections) should be treated similarly to 403 errors
    if (error.message && (error.message.includes('fetch') || error.message.includes('proxy'))) {
      throw new Error('ACCESS_FORBIDDEN'); // Treat network errors like geo-restriction
    }
    return null;
  }
}

// Function to process HTML with the extractCompanyData function
function processHtml(html) {
  return extractCompanyData(html);
}

// Check if an MC record is "NOT AUTHORIZED"
function isNotAuthorized(data) {
  return data && data['Operating Authority Status'] && 
         data['Operating Authority Status'].includes('NOT AUTHORIZED');
}

// Check if an MC record is "OUT-OF-SERVICE"
function isOutOfService(data) {
  return data && data['Operating Authority Status'] && 
         data['Operating Authority Status'].includes('OUT-OF-SERVICE');
}

// Export a scrapeData function that takes parameters needed for scraping
export async function scrapeData(
  mcNumbers, 
  format = 'json', 
  progressCallback = () => {}, 
  options = {}
) {
  const { includeNotAuthorized = false, sessionId = null } = options;
  
  // Get concurrency limit from appSettings instead of options
  const { getSetting } = await import('../config/appSettings.js');
  const concurrencyLimit = parseInt(getSetting('concurrencyLimit') || 5);
  
  
  // Initialize proxy manager with proxies from config or environment
  const proxies = options.proxies || getProxies();
  if (proxies && proxies.length > 0) {
    proxyManager.setProxies(proxies);
    
    
    // Do a quick health check at the start
    await proxyManager.healthCheckAllProxies().catch(err => {
    });
  } else {
    
  }
  
  // Variable to track if scraping should be stopped
  let stopRequested = false;
  
  // Register a stop handler if a sessionId is provided
  if (sessionId) {
    // Import and register with the session manager
    const { registerActiveSession, deregisterActiveSession } = await import('./sessionManager.js');
    registerActiveSession(sessionId, () => {
      stopRequested = true;
      
    });
    
    // Clean up when done
    const cleanupSession = () => {
      if (sessionId) {
        deregisterActiveSession(sessionId);
      }
    };
    
    // Ensure cleanup happens even if there's an error
    process.on('uncaughtException', (err) => {
      cleanupSession();
    });
    
    // Cleanup on normal termination
    process.on('SIGINT', () => {
      
      cleanupSession();
      process.exit(0);
    });
  }
  
  const startTime = Date.now();
  const allData = [];
  // Process MC numbers with controlled concurrency
  const batchCount = Math.ceil(mcNumbers.length / concurrencyLimit);
  const count = mcNumbers.length;
  
  // Flag to track if we should stop scraping due to geo-restriction
  let shouldStopScraping = false;
  
  // Track consecutive 403 errors to confirm geo-restriction
  // Only stop scraping after 5 consecutive 403 errors to avoid false positives
  let consecutive403Errors = 0;
  const MAX_CONSECUTIVE_403_ERRORS = 5; // Check 5 consecutive MCs for 403 before stopping
  
  
  progressCallback({ 
    type: 'init', 
    totalBatches: batchCount,
    totalRecords: count 
  });
    let processed = 0;
  let successful = 0;
  
  // Process MC numbers in parallel with limited concurrency
  for (let i = 0; i < mcNumbers.length; i += concurrencyLimit) {
    // Check if stop was requested before processing the next batch
    if (stopRequested) {
      progressCallback({
        type: 'manualStop',
        message: 'Scraping stopped by user request'
      });
      break;
    }
    
    // Get the current batch
    const batch = mcNumbers.slice(i, i + concurrencyLimit);
    const batchNumber = Math.floor(i/concurrencyLimit) + 1;
    
    progressCallback({
      type: 'batchStart', 
      batchNumber,
      totalBatches: batchCount
    });
    
    // Process each MC number in the current batch concurrently
    const batchPromises = batch.map(async (mcNumber) => {
      processed++;
      
      progressCallback({
        type: 'itemStart',
        mcNumber,
        processed,
        total: count
      });
        try {        const html = await fetchMCHtml(mcNumber);
        if (html) {
          // Reset consecutive 403 errors counter on successful fetch
          consecutive403Errors = 0;
          
          const data = extractCompanyData(html);
          
          if (data.error) {
            progressCallback({
              type: 'itemError',
              mcNumber,
              error: data.error
            });
            return null;
          } else {
            successful++;
            progressCallback({
              type: 'itemSuccess',
              mcNumber,
              data
            });
            return data;
          }
        }      } catch (error) {        // Special handling for geo-restriction/IP blocking
        if (error.message === 'ACCESS_FORBIDDEN') {
          consecutive403Errors++;
          let errorMessage = `Access Forbidden (403) - Possible geo-restriction or IP block (${consecutive403Errors}/${MAX_CONSECUTIVE_403_ERRORS})`;
          
          // Check if this might be due to a VPN disconnection (network error)
          if (error.stack && error.stack.includes('fetch')) {
            errorMessage = `Network error - VPN might be disconnected (${consecutive403Errors}/${MAX_CONSECUTIVE_403_ERRORS})`;
          }
          
          progressCallback({
            type: 'accessForbidden',
            mcNumber,
            error: errorMessage
          });
          
          // Only stop scraping after reaching the threshold of consecutive 403 errors
          if (consecutive403Errors >= MAX_CONSECUTIVE_403_ERRORS) {
            shouldStopScraping = true;
            progressCallback({
              type: 'geoRestrictionLimit',
              message: `Detected ${MAX_CONSECUTIVE_403_ERRORS} consecutive access errors. Stopping scraping to prevent wasted resources.`
            });
          }
        } else {
          // Reset consecutive 403 counter if we get a different error
          consecutive403Errors = 0;
          progressCallback({
            type: 'itemError',
            mcNumber,
            error: error.message
          });
        }
        return null;
      }
      return null;
    });
      // Wait for all promises in this batch to resolve
    const batchResults = await Promise.all(batchPromises);
      // Add successful results to allData
    batchResults.forEach(result => {
      if (!result) return;
      
      // Check if we should include NOT AUTHORIZED records
      const isNotAuth = isNotAuthorized(result);
      if (isNotAuth) {
        // Add the "notAuthorized" flag to mark for UI display
        result.notAuthorized = true;
      }
      
      // Check for OUT-OF-SERVICE status
      const isOOS = isOutOfService(result);
      if (isOOS) {
        // Add the "outOfService" flag to mark for UI display
        result.outOfService = true;
      }
      
      // Only add if it's authorized OR we're including not authorized records
      if (!isNotAuth || includeNotAuthorized) {
        allData.push(result);
      }
    });
      progressCallback({
      type: 'batchComplete',
      batchNumber,
      totalBatches: batchCount,
      batchSize: batch.length
    });
    
    // If we've determined we should stop scraping due to geo-restriction errors, break out of the loop
    if (shouldStopScraping) {
      progressCallback({
        type: 'earlyStopped',
        reason: 'geoRestriction',
        message: 'Scraping stopped early due to multiple geo-restriction errors.'
      });
      break;
    }
  }
    progressCallback({
    type: 'complete',
    totalRecords: count,
    processedRecords: processed,
    successfulRecords: successful,
    executionTime: (Date.now() - startTime) / 1000,
    earlyStopped: shouldStopScraping || stopRequested,
    manualStop: stopRequested
  });

  // Clean up the session if we registered one
  if (sessionId) {
    const { deregisterActiveSession } = await import('./sessionManager.js');
    deregisterActiveSession(sessionId);
  }

  return allData;
}

// Function to save data to CSV
export function saveToCSV(data, filePath = null) {
  if (data.length > 0) {
    try {
      const csv = parse(data);
      
      // If in a Node.js environment and filePath is provided
      if (typeof window === 'undefined' && filePath) {
        fs.writeFileSync(filePath, csv);
        return { success: true, filePath };
      }
      
      // For web environment, return the CSV data
      return { success: true, csvData: csv, fileName: 'scraped_data.csv' };
    } catch (error) {
      throw error;
    }
  }
  return { success: false, error: 'No data to export' };
}
