import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProxyManager from './components/ProxyManager';
import SettingsManager from './components/SettingsManager';
import ThemeToggle from './components/ThemeToggle';
import { logout } from './utils/auth';

function Admin() {
  const [activeTab, setActiveTab] = useState('proxies');
  const navigate = useNavigate();
  
  // Handle manual logout
  const handleLogout = () => {
    // Clear authentication state
    logout();
    // Redirect to login page
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
                Admin Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-light transition-colors"
                >
                  Logout
                </button>
                <ThemeToggle />
              </div>
            </div>
            
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 transition-colors">
              <nav className="flex space-x-4">
                <button
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'proxies'
                      ? 'text-accent dark:text-accent-light border-b-2 border-accent dark:border-accent-light'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('proxies')}
                >
                  Proxy Management
                </button>
                <button
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'text-accent dark:text-accent-light border-b-2 border-accent dark:border-accent-light'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
                <button
                  className={`py-2 px-4 font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'text-accent dark:text-accent-light border-b-2 border-accent dark:border-accent-light'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('stats')}
                >
                  Statistics
                </button>
              </nav>
            </div>
            
            {activeTab === 'proxies' && <ProxyManager />}
            
            {activeTab === 'settings' && <SettingsManager />}
            
            {activeTab === 'stats' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors">
                  Statistics
                </h2>
                <p className="text-gray-600 dark:text-gray-400 transition-colors">
                  Coming soon: Usage statistics, error rates, and other metrics.
                </p>
              </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
              <p>Carrier Data Scraper - Admin Panel</p>
              <p>
                <a href="/" className="text-accent hover:text-accent-hover dark:text-accent-light dark:hover:text-accent transition-colors">
                  Return to Main Application
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
