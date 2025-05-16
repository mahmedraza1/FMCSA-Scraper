import { createContext, useContext, useState, useEffect } from 'react';

// Create theme context
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme state from local storage or system preference
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen for custom theme toggle events (from toggleTheme.js)
  useEffect(() => {
    const handleCustomThemeToggle = (event) => {
      console.log('Caught custom theme toggle event:', event.detail);
      setIsDark(event.detail.isDark);
    };
    
    document.addEventListener('themeToggled', handleCustomThemeToggle);
    
    return () => {
      document.removeEventListener('themeToggled', handleCustomThemeToggle);
    };
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    // Apply theme
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
    
    // Force a refresh of styles by triggering a reflow with a small delay
    const forceReflow = () => {
      document.body.style.display = 'none';
      setTimeout(() => {
        document.body.offsetHeight; // Force reflow
        document.body.style.display = '';
      }, 10);
    };
    
    forceReflow();
    
    // Log theme change for debugging
    console.log('Theme changed to:', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Toggle theme function
  const toggleTheme = () => {
    console.log('Toggle theme called');
    setIsDark(prev => {
      const newValue = !prev;
      console.log('Setting isDark to:', newValue);
      return newValue;
    });
  };

  // Context value
  const contextValue = {
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
