import { useState } from 'react';

const ResultsModal = ({ isOpen, results = [], onClose, onExportCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // If modal is not open, don't render
  if (!isOpen) return null;
  
  // Filter data based on search term
  const filteredData = results.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] flex flex-col transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 transition-colors">Scraping Results</h2>          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors"
              onClick={onExportCSV}
            >
              Export as CSV
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
          <input
            type="text"
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          />
        </div>
        
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 flex gap-4 transition-colors">
          <span>Total Records: {results.length}</span>
          {searchTerm && <span>Filtered Records: {filteredData.length}</span>}
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
                  >
                    {Object.entries(item)
                      .filter(([key]) => !['notAuthorized', 'outOfService'].includes(key)) // Hide the status flags
                      .map(([key, value], idx) => (
                      <td 
                        key={`${index}-${idx}`} 
                        className={`px-6 py-4 whitespace-nowrap text-sm transition-colors ${
                          item.notAuthorized ? 'text-red-600 dark:text-red-400 font-medium' : 
                          item.outOfService ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {value || '-'}
                      </td>
                    ))}
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
