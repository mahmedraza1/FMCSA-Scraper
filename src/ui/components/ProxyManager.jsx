import { useState, useEffect, useRef } from 'react';

const ProxyManager = () => {
  const [proxyStats, setProxyStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newProxies, setNewProxies] = useState('');
  const [showRotationPrompt, setShowRotationPrompt] = useState(false);
  const [selectedProxies, setSelectedProxies] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  // Fetch proxy status on component mount and periodically
  useEffect(() => {
    fetchProxyStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchProxyStatus();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch proxy status from API
  const fetchProxyStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/proxy/status`, {
        headers: {
          'Content-Type': 'application/json',
          // Session authentication
          'Authorization': `Bearer ${sessionStorage.getItem('isAuthenticated') ? 'authenticated' : ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch proxy status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProxyStats(data);
    } catch (err) {
      console.error('Failed to fetch proxy status:', err);
      setError('Failed to fetch proxy status. You may not have permission to access this feature.');
    } finally {
      setLoading(false);
    }
  };
  
  // Configure new proxies
  const handleConfigureProxies = async () => {
    if (!newProxies.trim()) {
      setError('Please enter at least one proxy.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse proxy list (one per line)
      const proxies = newProxies.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      const response = await fetch(`${API_URL}/proxy/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('isAuthenticated') ? 'authenticated' : ''}`
        },
        body: JSON.stringify({ proxies }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to configure proxies: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProxyStats(data);
      setNewProxies('');
      setShowRotationPrompt(true);
    } catch (err) {
      console.error('Failed to configure proxies:', err);
      setError('Failed to configure proxies. Check format and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Rotate to next proxy
  const handleRotateProxy = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/proxy/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('isAuthenticated') ? 'authenticated' : ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rotate proxy: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProxyStats(data);
      
      // Hide the rotation prompt
      setShowRotationPrompt(false);
    } catch (err) {
      console.error('Failed to rotate proxy:', err);
      setError('Failed to rotate proxy.');
    } finally {
      setLoading(false);
    }
  };

  // Handle JSON file import
  const handleImportProxies = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        
        if (Array.isArray(jsonData)) {
          // Simple array format
          setNewProxies(jsonData.join('\n'));
        } else if (jsonData.proxies && Array.isArray(jsonData.proxies)) {
          // Object with proxies array
          setNewProxies(jsonData.proxies.join('\n'));
        } else {
          throw new Error('Invalid proxy configuration format');
        }
      } catch (err) {
        setError(`Failed to parse proxy JSON: ${err.message}`);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the file');
    };
    
    reader.readAsText(file);
  };
  
  // Toggle proxy selection for deletion
  const toggleProxySelection = (index) => {
    setSelectedProxies(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Delete selected proxies
  const handleDeleteSelectedProxies = async () => {
    if (selectedProxies.length === 0) {
      setError('Please select at least one proxy to delete.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/proxy/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('isAuthenticated') ? 'authenticated' : ''}`
        },
        body: JSON.stringify({ indexes: selectedProxies }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete proxies: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProxyStats(data);
      setSelectedProxies([]);
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete proxies:', err);
      setError('Failed to delete proxies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors">
        Proxy Manager
      </h2>
      
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md transition-colors">
        <p className="font-medium">New Feature:</p> 
        <p className="text-sm">Proxies are now stored directly in a structured JSON file. You no longer need to manually edit a text file. 
        You can import and export proxy configurations using the tools below.</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors">
          <p>{error}</p>
        </div>
      )}
      
      {showRotationPrompt && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md flex justify-between items-center transition-colors">
          <p>New proxies configured. Would you like to rotate to a new proxy now?</p>
          <button 
            onClick={handleRotateProxy}
            className="ml-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
            disabled={loading}
          >
            {loading ? 'Rotating...' : 'Rotate Now'}
          </button>
        </div>
      )}
      
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full transition-colors">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 transition-colors">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">
              Are you sure you want to delete {selectedProxies.length} selected {selectedProxies.length === 1 ? 'proxy' : 'proxies'}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelectedProxies}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Proxy Stats */}
        <div className="md:w-1/2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors">
            Current Status
          </h3>
          
          {loading && !proxyStats ? (
            <div className="flex justify-center items-center h-40">
              <span className="animate-pulse">Loading proxy status...</span>
            </div>
          ) : proxyStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 block transition-colors">Total Proxies:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 transition-colors">{proxyStats.stats.totalProxies}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 block transition-colors">Current Proxy:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 break-all transition-colors">{proxyStats.stats.currentProxy || 'None'}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 block transition-colors">Success Rate:</span>
                  <span className="font-medium text-accent dark:text-accent-light transition-colors">{proxyStats.stats.successRate}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                  <span className="text-gray-500 dark:text-gray-400 block transition-colors">Total Requests:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 transition-colors">{proxyStats.stats.totalRequests}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors">
                  Proxy List
                </h4>
                
                {selectedProxies.length > 0 && (
                  <div className="mb-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                      {selectedProxies.length} {selectedProxies.length === 1 ? 'proxy' : 'proxies'} selected
                    </span>
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
                
                <div className="max-h-40 overflow-y-auto border dark:border-gray-700 rounded transition-colors">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                    <thead className="bg-gray-50 dark:bg-gray-800 transition-colors">
                      <tr>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                          Select
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Proxy</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                      {proxyStats.stats.proxyStatus.map((proxy, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProxies.includes(index)}
                              onChange={() => toggleProxySelection(index)}
                              className="form-checkbox h-4 w-4 text-accent rounded transition-colors"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 break-all transition-colors">
                            {proxy.proxy}
                          </td>
                          <td className="px-4 py-2 text-sm transition-colors">
                            {proxy.healthy ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 transition-colors">
                                Healthy
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 transition-colors">
                                Failed ({proxy.consecutiveFailures})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Storage Status */}
              {proxyStats.storage && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors">
                    Storage Status
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                      <span className="text-gray-500 dark:text-gray-400 block transition-colors">JSON Storage:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 transition-colors">
                        {proxyStats.storage.jsonStorage.exists 
                          ? `Available (Last modified: ${new Date(proxyStats.storage.jsonStorage.lastModified).toLocaleString()})` 
                          : 'Not available'}
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded transition-colors">
                      <span className="text-gray-500 dark:text-gray-400 block transition-colors">Legacy Text Storage:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 transition-colors">
                        {proxyStats.storage.legacyStorage.exists 
                          ? `Available (Last modified: ${new Date(proxyStats.storage.legacyStorage.lastModified).toLocaleString()})` 
                          : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between">
                <button
                  onClick={fetchProxyStatus}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh Status'}
                </button>
                
                <button
                  onClick={handleRotateProxy}
                  className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 transition-colors"
                  disabled={loading || proxyStats.stats.totalProxies < 2}
                >
                  {loading ? 'Rotating...' : 'Rotate Proxy'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
              <p>No proxy stats available</p>
            </div>
          )}
        </div>
        
        {/* Configure New Proxies */}
        <div className="md:w-1/2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors">
            Configure Proxies
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              Enter one proxy per line in format: http://user:pass@host:port or socks5://user:pass@host:port
            </p>
            
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-40 transition-colors"
              placeholder="http://username:password@host:port"
              value={newProxies}
              onChange={(e) => setNewProxies(e.target.value)}
            />
            
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <span role="img" aria-label="Info">ℹ️</span> Proxies are saved in JSON format. No text file needed!
              </span>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportProxies}
                  ref={fileInputRef}
                  className="hidden"
                  id="proxy-json-import"
                />
                <label
                  htmlFor="proxy-json-import"
                  className="cursor-pointer text-accent hover:text-accent-hover dark:text-accent-light dark:hover:text-accent-dark"
                >
                  Import JSON
                </label>
                {proxyStats?.configuredProxies?.length > 0 && (
                  <button
                    onClick={() => {
                      // Create downloadable JSON
                      const dataStr = JSON.stringify({
                        updatedAt: new Date().toISOString(),
                        proxies: proxyStats.configuredProxies
                      }, null, 2);
                      const dataBlob = new Blob([dataStr], {type: 'application/json'});
                      const url = URL.createObjectURL(dataBlob);
                      
                      // Create download link
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'proxy-config.json';
                      document.body.appendChild(a);
                      a.click();
                      
                      // Clean up
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 100);
                    }}
                    className="text-accent hover:text-accent-hover dark:text-accent-light dark:hover:text-accent-dark"
                  >
                    Export JSON
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={handleConfigureProxies}
              className="w-full px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              disabled={loading}
            >
              {loading ? 'Configuring...' : 'Configure Proxies'}
            </button>
            
            {/* Import Proxies from JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Import Proxies (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportProxies}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 file:py-2 file:px-4 file:border file:border-gray-300 dark:file:border-gray-600 file:rounded-md file:bg-gray-50 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 transition-colors"
                ref={fileInputRef}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a JSON file to import proxies. Existing proxies will be replaced.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProxyManager;
