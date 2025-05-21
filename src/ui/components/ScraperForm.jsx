import { useState, useEffect } from 'react';
import { API_URL } from '../utils/env';

const ScraperForm = ({ onStartScraping, isScrapingActive }) => {
  const [startMC, setStartMC] = useState('');
  const [count, setCount] = useState('');
  const [includeNotAuthorized, setIncludeNotAuthorized] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [maxRecords, setMaxRecords] = useState(1000); // Default max records
  
  // Fetch max records setting from the server on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/settings`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            // Update max records from server settings
            setMaxRecords(data.settings.maxRecordsPerScrape || 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching max records setting:', error);
        // Use default value on error
      }
    };
    
    fetchSettings();
  }, []);
  
  const validateForm = () => {
    const errors = {};
    
    const startMCNum = startMC === '' ? 0 : parseInt(startMC, 10);
    if (startMC === '' || isNaN(startMCNum) || startMCNum <= 0) {
      errors.startMC = 'Please enter a valid MC/MX number';
    }
    
    const countNum = count === '' ? 0 : parseInt(count, 10);
    if (count === '' || isNaN(countNum) || countNum <= 0 || countNum > maxRecords) {
      errors.count = `Please enter a valid count between 1 and ${maxRecords}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Use default values if fields are left empty
      const startMCNum = parseInt(startMC || '1635500', 10);
      const countNum = parseInt(count || '10', 10);
        
      // Generate array of MC numbers
      const mcNumbers = Array.from({ length: countNum }, (_, i) => startMCNum + i);
      
      onStartScraping({
        mcNumbers,
        includeNotAuthorized
      });
    }
  };
    return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 transition-colors">
      <form onSubmit={handleSubmit}><div className="mb-4">          <label htmlFor="startMC" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
            Starting MC/MX Number:
          </label><input
            type="number"
            id="startMC"
            value={startMC}
            onChange={(e) => setStartMC(e.target.value)}
            disabled={isScrapingActive}
            placeholder="1635500"            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent 
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors
              ${formErrors.startMC 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
              }`}
          />          {formErrors.startMC && (
            <div className="mt-1 text-sm text-red-600 dark:text-red-400 transition-colors">{formErrors.startMC}</div>
          )}
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            Enter a valid MC/MX number to start from (e.g. 1635500)
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="count" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors">
            Number of Records to Scrape:
          </label>
          <input
            type="number"
            id="count"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            disabled={isScrapingActive}
            placeholder="10"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent 
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors
              ${formErrors.count 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
              }`}
          />
          {formErrors.count && (
            <div className="mt-1 text-sm text-red-600 dark:text-red-400 transition-colors">{formErrors.count}</div>
          )}          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
            How many records to scrape (default: 10, max: {maxRecords})
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeNotAuthorized"
              checked={includeNotAuthorized}
              onChange={(e) => setIncludeNotAuthorized(e.target.checked)}
              disabled={isScrapingActive}              className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 rounded transition-colors"
            />
            <label htmlFor="includeNotAuthorized" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
              Include NOT AUTHORIZED MC records
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6 transition-colors">
            When checked, MC numbers with "NOT AUTHORIZED" status will be included in results (shown in red).
          </div>
        </div>        <button 
          type="submit" 
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
            isScrapingActive 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : 'bg-accent hover:bg-accent-hover active:bg-accent-hover dark:bg-accent'
          }`}
          disabled={isScrapingActive}
        >
          {isScrapingActive ? 'Scraping in Progress...' : 'Start Scraping'}
        </button>
      </form>
    </div>
  );
};

export default ScraperForm;
