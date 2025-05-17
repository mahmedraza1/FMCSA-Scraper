import { useState } from 'react';

const ResultsModal = ({ isOpen, results = [], onClose, onExportCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // If modal is not open, don't render
  if (!isOpen) return null;
    // Filter data based on search term
  const filteredData = results.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return Object.entries(item).some(([key, value]) => {
      // Skip notAuthorized and outOfService flags for search
      if (key === 'notAuthorized' || key === 'outOfService') return false;
      
      // Check if the value contains the search term
      return value && value.toString().toLowerCase().includes(searchLower);
    });
  });
  
  // Handle export with loading state
  const handleExport = async () => {
    setExporting(true);
    try {
      await onExportCSV(filteredData);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] flex flex-col transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 transition-colors">Scraping Results</h2>          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              onClick={handleExport}
              disabled={exporting}
              title={searchTerm ? "Export filtered results" : "Export all results"}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>Export as CSV {searchTerm && `(${filteredData.length})`}</>
              )}
            </button>
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div className="relative">
            <input
              type="text"
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-4 items-center transition-colors">
          <span>Total Records: {results.length}</span>
          {searchTerm && (
            <>
              <span className="font-medium text-accent dark:text-accent-light">
                Filtered Records: {filteredData.length}
              </span>
              <span className="text-xs italic">
                (Exporting will include only the {filteredData.length} filtered records)
              </span>
            </>
          )}
        </div>
        
        <div className="overflow-auto flex-1">
          {filteredData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 transition-colors">
                <tr>
                  {Object.keys(filteredData[0])
                    .filter(key => !['notAuthorized', 'outOfService'].includes(key)) // Hide the status flags
                    .map((key) => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {filteredData.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      item.notAuthorized ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20' : 
                      item.outOfService ? 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20' : ''
                    }`}
                  >                    {Object.entries(item)
                      .filter(([key]) => !['notAuthorized', 'outOfService'].includes(key)) // Hide the status flags
                      .map(([key, value], idx) => {
                        // Determine if this cell matches the search term
                        const isMatch = searchTerm && value && 
                          value.toString().toLowerCase().includes(searchTerm.toLowerCase());
                        
                        return (
                          <td 
                            key={`${index}-${idx}`} 
                            className={`px-6 py-4 whitespace-nowrap text-sm transition-colors ${
                              item.notAuthorized ? 'text-red-600 dark:text-red-400 font-medium' : 
                              item.outOfService ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 
                              isMatch ? 'text-accent dark:text-accent-light font-medium' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {value || '-'}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 transition-colors">
              {results.length === 0 ? 'No results to display' : 'No matching results for your search'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
