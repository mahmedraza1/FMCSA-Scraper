import { useState, useEffect } from 'react';

function SettingsManager() {
  const [settings, setSettings] = useState({
    concurrencyLimit: 5,
    maxRecordsPerScrape: 1000,
    saveResultsAutomatically: false,
    defaultStartMcNumber: 1635500
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // Function to fetch settings from the server
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      setError(`Error fetching settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to save settings
  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Settings saved successfully');
        // Update settings with values from the server (which might have been normalized)
        setSettings(data.settings);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setError(`Error saving settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Parse numeric values
    if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0
      }));
    } else if (type === 'checkbox') {
      setSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors">
        Application Settings
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md transition-colors">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      <form onSubmit={saveSettings}>
        <div className="mb-4">
          <label htmlFor="concurrencyLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
            Concurrency Limit
          </label>
          <input
            type="number"
            id="concurrencyLimit"
            name="concurrencyLimit"
            value={settings.concurrencyLimit}
            onChange={handleInputChange}
            min="1"
            max="20"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            Number of concurrent requests when scraping (1-20). Higher values can speed up scraping but may increase the risk of rate-limiting or errors.
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="maxRecordsPerScrape" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
            Maximum Records Per Scrape
          </label>
          <input
            type="number"
            id="maxRecordsPerScrape"
            name="maxRecordsPerScrape"
            value={settings.maxRecordsPerScrape}
            onChange={handleInputChange}
            min="10"
            max="5000"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            Maximum number of records a user can scrape in a single request (10-5000).
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="defaultStartMcNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
            Default Starting MC Number
          </label>
          <input
            type="number"
            id="defaultStartMcNumber"
            name="defaultStartMcNumber"
            value={settings.defaultStartMcNumber}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            The default MC number to start from when the user doesn't enter one.
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveResultsAutomatically"
              name="saveResultsAutomatically"
              checked={settings.saveResultsAutomatically}
              onChange={handleInputChange}
              className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 rounded transition-colors"
            />
            <label htmlFor="saveResultsAutomatically" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
              Save Results Automatically
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6 transition-colors">
            When enabled, scraping results will be automatically saved to CSV when scraping completes.
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsManager;
