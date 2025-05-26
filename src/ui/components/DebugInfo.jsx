import { useState, useEffect } from 'react';

const DebugInfo = () => {
  const [appInfo, setAppInfo] = useState({});
  
  useEffect(() => {
    // Collect information about the environment
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      viteEnv: import.meta.env.MODE || 'unknown'
    };
    
    setAppInfo(info);
    
    // Log to console as well
  }, []);
    return (
    <div className="fixed bottom-0 left-0 p-4 bg-black bg-opacity-80 dark:bg-opacity-70 text-white text-xs max-w-full overflow-auto max-h-48 transition-colors">
      <h3 className="font-bold mb-2">Debug Information</h3>
      <pre>{JSON.stringify(appInfo, null, 2)}</pre>
    </div>
  );
};

export default DebugInfo;
