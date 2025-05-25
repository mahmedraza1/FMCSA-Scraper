import { createContext, useContext, useEffect } from 'react';

// Create theme context with light mode only
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Apply light theme only
  useEffect(() => {
    // Force light mode only
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
    
    // Force a refresh of styles by triggering a reflow with a small delay
    const forceReflow = () => {
      document.body.style.display = 'none';
      setTimeout(() => {
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';
      }, 10);
    };
    
    forceReflow();
    
    // Log theme for debugging
    console.log('Theme set to: light (dark mode disabled)');
  }, []);

  // Toggle theme function - now does nothing
  const toggleTheme = () => {
    console.log('Toggle theme called - ignoring as app is light mode only');
  };

  // Context value - always light mode
  const contextValue = {
    isDark: false,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
