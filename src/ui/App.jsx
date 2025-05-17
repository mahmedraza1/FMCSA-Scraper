import { useState, useEffect, useCallback } from 'react'
import ScraperForm from './components/ScraperForm'
import ScraperProgress from './components/ScraperProgress'
import ResultsModal from './components/ResultsModal'
import ThemeToggle from './components/ThemeToggle'
import { SSEConnectionManager } from './utils/sseConnection'

function App() {
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    successful: 0,
    batchNumber: 0,
    totalBatches: 0
  });
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [geoRestrictionWarning, setGeoRestrictionWarning] = useState(false);
  const [sseManager, setSseManager] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Initialize SSE manager on component mount
  useEffect(() => {
    const manager = new SSEConnectionManager(API_URL);
    
    // Set up event handlers
    manager.onMessage(handleProgressUpdate);
    
    manager.onError((error) => {
      console.error('SSE manager error:', error);
      setLogs(prev => [...prev, `❌ Connection error: ${error.message}`]);
      
      // If scraping is still active, show an error
      if (isScrapingActive) {
        setError('Lost connection to the server. Please try again.');
      }
    });
    
    manager.onConnected((data) => {
      console.log('SSE connection established with session ID:', data.sessionId);
      setLogs(prev => [...prev, `🔌 Connected to server with session: ${data.sessionId}`]);
    });
    
    manager.onDisconnected(() => {
      console.log('SSE connection closed');
      // Only show disconnection message if scraping is still active
      if (isScrapingActive) {
        setLogs(prev => [...prev, `🔌 Disconnected from server`]);
      }
    });
    
    setSseManager(manager);
    
    // Clean up on component unmount
    return () => {
      manager.disconnect();
    };
  }, []);
  
  // Update isScrapingActive dependencies for the error handler
  useEffect(() => {
    if (sseManager) {
      sseManager.onError((error) => {
        console.error('SSE manager error:', error);
        setLogs(prev => [...prev, `❌ Connection error: ${error.message}`]);
        
        // If scraping is still active, show an error
        if (isScrapingActive) {
          setError('Lost connection to the server. Please try again.');
          setIsScrapingActive(false);
        }
      });
    }
  }, [isScrapingActive, sseManager]);

  // Function to handle scraping action
  const handleStartScraping = async (params) => {
    setIsScrapingActive(true);
    setResults([]);
    setLogs([]);
    setError(null);
    setGeoRestrictionWarning(false);
    
    // Make sure concurrencyLimit is a number
    const concurrencyLimit = parseInt(params.concurrencyLimit) || 5;
    params.concurrencyLimit = concurrencyLimit;
    
    setProgress({
      processed: 0,
      total: params.mcNumbers.length,
      successful: 0,
      batchNumber: 0,
      totalBatches: Math.ceil(params.mcNumbers.length / concurrencyLimit)
    });
    
    try {
      const response = await fetch(`${API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Set up SSE connection with the returned session ID
        if (data.sessionId) {
          // Connect using the SSE manager
          if (sseManager) {
            const connected = sseManager.connect(data.sessionId);
            if (connected) {
              // Add initial log message with session ID
              setLogs(prev => [...prev, `🔑 Scraping session started: ${data.sessionId}`]);
            } else {
              throw new Error('Failed to establish server connection');
            }
          } else {
            throw new Error('SSE manager not initialized');
          }
        } else {
          throw new Error('No session ID returned from server');
        }
      } else {
        setError(data.error || 'Unknown error occurred');
        setIsScrapingActive(false);
      }
    } catch (error) {
      console.error('Error during scraping:', error);
      setError(error.message);
      setIsScrapingActive(false);
    }
  };
  
  // No longer needed - using SSE manager instead
  
  // Ensure results modal is closed whenever geo-restriction warning is shown
  useEffect(() => {
    if (geoRestrictionWarning) {
      setShowResults(false);
    }
  }, [geoRestrictionWarning]);
  
  // Function to handle CSV export
  const handleSaveToCsv = async (data) => {
    try {
      // Get the current session ID if connected
      let sessionId = null;
      if (sseManager) {
        sessionId = sseManager.sessionId;
      }
      
      const response = await fetch(`${API_URL}/save-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, sessionId }),
      });
      
      if (response.headers.get('Content-Type').includes('text/csv')) {
        // It's a CSV file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scraped_data.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
        return true;
      } else {
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to save CSV');
        }
        return true;
      }
    } catch (error) {
      console.error('Error saving CSV:', error);
      setError(error.message);
      return false;
    }
  };
  
  // Define handleProgressUpdate before using it in useEffect
  const handleProgressUpdate = useCallback((progressData) => {
    console.log('Progress update:', progressData);
    
    // Update progress based on data type
    switch (progressData.type) {
      case 'init':
        setProgress(prev => ({
          ...prev,
          total: progressData.totalRecords,
          totalBatches: progressData.totalBatches || Math.ceil(progressData.totalRecords / 5) // fallback to default batch size
        }));
        console.log(`Initializing with totalBatches: ${progressData.totalBatches}`);
        setLogs(prev => [...prev, `🚀 Starting to scrape ${progressData.totalRecords} records in ${progressData.totalBatches} batches`]);
        break;
        
      case 'batchStart':
        setProgress(prev => ({
          ...prev,
          batchNumber: progressData.batchNumber
        }));
        console.log(`Processing batch ${progressData.batchNumber}/${progressData.totalBatches}`);
        setLogs(prev => [...prev, `📊 Starting batch ${progressData.batchNumber}/${progressData.totalBatches}`]);
        break;
        
      case 'itemStart':
        setProgress(prev => ({
          ...prev,
          processed: progressData.processed,
          total: progressData.total
        }));
        break;
        
      case 'itemSuccess':
        setProgress(prev => ({
          ...prev,
          successful: (prev.successful || 0) + 1
        }));
        setLogs(prev => [...prev, `✅ MC/MX ${progressData.mcNumber}: Data retrieved successfully`]);
        break;
        
      case 'itemError':
        setLogs(prev => [...prev, `❌ MC/MX ${progressData.mcNumber}: ${progressData.error || 'Failed to retrieve data'}`]);
        break;
        
      case 'accessForbidden':
        setLogs(prev => [...prev, `⚠️ MC/MX ${progressData.mcNumber}: ${progressData.error}`]);
        // Always update the error message to show the latest count of consecutive errors
        setGeoRestrictionWarning(true);
        // Make sure results modal is closed when geo-restriction errors occur
        setShowResults(false);
        setError(`Access to SAFER website may be blocked. Detected ${progressData.error.match(/\((\d+)\/(\d+)\)/)?.[1] || '?'} of 5 consecutive access errors. If this continues, scraping will stop automatically.`);
        break;
        
      case 'geoRestrictionLimit':
        setLogs(prev => [...prev, `⛔ ${progressData.message}`]);
        setError('Detected 5 consecutive geo-restriction errors. Scraping has been automatically stopped to prevent wasted resources. Please connect to a U.S. VPN or try a different location in your VPN before scraping again.');
        setGeoRestrictionWarning(true);
        // Prevent showing results when geo-restriction occurs
        setShowResults(false);
        break;
        
      case 'earlyStopped':
        setLogs(prev => [...prev, `⛔ ${progressData.message}`]);
        break;
        
      case 'batchComplete':
        setLogs(prev => [...prev, `✅ Finished batch ${progressData.batchNumber}/${progressData.totalBatches}`]);
        break;
        
      case 'complete':
        if (progressData.earlyStopped) {
          setLogs(prev => [...prev, `⚠️ Scraping stopped early: ${progressData.successfulRecords}/${progressData.processedRecords} records processed in ${progressData.executionTime}s`]);
        } else {
          setLogs(prev => [...prev, `✅ Scraping completed: ${progressData.successfulRecords || progressData.results?.length || 0}/${progressData.totalRecords || progress.total} records in ${progressData.executionTime || '?'}s`]);
        }
        if (progressData.results) {
          setResults(progressData.results);
          // Only show results if there was no geo-restriction warning and we have results
          if (!geoRestrictionWarning && progressData.results.length > 0) {
            setShowResults(true);
          } else if (geoRestrictionWarning) {
            // Explicitly ensure results are not shown with geo-restriction warnings
            setShowResults(false);
          }
        }
        
        // Set scraping to inactive and close the SSE connection
        setTimeout(() => {
          setIsScrapingActive(false);
          if (sseManager) {
            sseManager.disconnect();
          }
        }, 500);
        break;
        
      case 'error':
        setLogs(prev => [...prev, `❌ Error: ${progressData.message}`]);
        setError(progressData.message);
        
        // Set scraping to inactive and close the SSE connection if this is a fatal error
        if (progressData.fatal) {
          setTimeout(() => {
            setIsScrapingActive(false);
            if (sseManager) {
              sseManager.disconnect();
            }
          }, 500);
        }
        break;
        
      default:
        // Handle unknown progress type
        if (progressData.message) {
          setLogs(prev => [...prev, `ℹ️ ${progressData.message}`]);
        }
    }
  }, [progress.total, geoRestrictionWarning, sseManager]);
  
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors">
        <div className="p-6">
          <div className="bg-[url('/dispatchLight.png')] dark:bg-[url('/dispatchDark.png')] bg-no-repeat bg-contain h-10 w-96"></div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
              Carrier Data Scraper
            </h1>
            <ThemeToggle />
          </div>
          
          {error && geoRestrictionWarning && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 flex items-center justify-center z-50 transition-colors">
              <div className="bg-amber-100 dark:bg-yellow-900/70 p-5 rounded-lg shadow-lg max-w-lg w-full transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">⚠️ Access Error Warning</h3>
                  <button 
                    className="text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-400 transition-colors"
                    onClick={() => {
                      setError(null);
                      setGeoRestrictionWarning(false);
                    }}
                  >
                    ✕
                  </button>
                </div>
                <p className="mb-3 text-yellow-800 dark:text-yellow-300">{error}</p>
                <div className="mt-3">
                  <p className="font-medium text-sm text-yellow-800 dark:text-yellow-300">Possible solutions:</p>
                  <ul className="list-disc pl-5 text-sm mt-1 text-yellow-800 dark:text-yellow-200">
                    <li>Use a VPN with a U.S. server</li>
                    <li>If you're already using a VPN, try selecting a different location</li>
                    <li>Try a different network connection</li>
                    <li>Wait a few hours if your IP has been temporarily blocked</li>
                  </ul>
                  <button 
                    className="mt-4 px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover active:bg-accent-dark w-full transition-colors"
                    onClick={() => {
                      setError(null);
                      setGeoRestrictionWarning(false);
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {error && !geoRestrictionWarning && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors">
              <p className="font-medium">Error: {error}</p>
              <button 
                className="mt-2 text-sm text-accent hover:text-accent-dark dark:text-accent-light dark:hover:text-accent transition-colors"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          
          <ScraperForm 
            onStartScraping={handleStartScraping} 
            isScrapingActive={isScrapingActive}
          />
          
          {isScrapingActive && (
            <ScraperProgress 
              progress={progress} 
              logs={logs}
            />
          )}
        </div>
      </div>
      
      <ResultsModal 
        isOpen={showResults && !geoRestrictionWarning} 
        onClose={() => setShowResults(false)}
        results={results}
        onExportCSV={(dataToExport) => handleSaveToCsv(dataToExport)}
      />
    </div>
  );
}

export default App

