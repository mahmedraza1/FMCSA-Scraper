// filepath: /home/mark/Scraper/src/ui/components/ScraperProgress.jsx
import { useEffect, useRef } from 'react';

const ScraperProgress = ({ progress, logs }) => {
  const logsEndRef = useRef(null);
  
  // Auto-scroll to the bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // Calculate progress percentage
  const progressPercentage = progress.total > 0
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;
  
  // Get the appropriate log entry CSS class
  const getLogClass = (logText) => {
    if (logText.startsWith('✅')) return 'border-l-4 border-accent text-accent dark:text-accent-light';
    if (logText.startsWith('❌')) return 'border-l-4 border-red-500 text-red-800 dark:text-red-300';
    if (logText.startsWith('⚠️')) return 'border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300';
    if (logText.startsWith('🚀')) return 'border-l-4 border-accent text-accent dark:text-accent-light';
    if (logText.startsWith('📊')) return 'border-l-4 border-purple-500 text-purple-800 dark:text-purple-300';
    if (logText.startsWith('ℹ️')) return 'border-l-4 border-gray-500 text-gray-800 dark:text-gray-300';
    return 'border-l-4 border-accent text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8 transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Scraping Progress</h3>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Processed</div>
            <div className="font-semibold dark:text-gray-200">{progress.processed || 0}/{progress.total || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Success</div>
            <div className="font-semibold text-accent dark:text-accent-light">{progress.successful || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Batch</div>
            <div className="font-semibold dark:text-gray-200">
              {progress.batchNumber || 0}/{progress.totalBatches || 0}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors">
          <div 
            className="h-full bg-accent flex items-center justify-center text-xs text-white font-semibold transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%`, minWidth: progressPercentage > 0 ? '2rem' : '0' }}
          >
            {progressPercentage}%
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Activity Log
        </div>
        <div className="h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 text-sm transition-colors">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className={`p-2 mb-1 bg-white dark:bg-gray-800 ${getLogClass(log)} transition-colors`}>
                {log}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500 dark:text-gray-400 text-center transition-colors">
              Waiting for scraping activity...
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ScraperProgress;
