/**
 * This is a utility script to test theme toggling from the browser console
 * You can call window.toggleTheme() from the console to test the theme toggle functionality
 */

// Expose the function globally for testing
window.toggleTheme = function() {
  // Get current theme
  const isDarkMode = document.documentElement.classList.contains('dark');
  console.log('Current theme:', isDarkMode ? 'dark' : 'light');
  
  if (isDarkMode) {
    // Switch to light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
    console.log('Switched to light mode');
  } else {
    // Switch to dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.setItem('theme', 'dark');
    console.log('Switched to dark mode');
  }
  
  // Force a refresh of CSS variables by triggering a reflow with a delay
  document.body.style.display = 'none';
  setTimeout(() => {
    document.body.offsetHeight; // Force reflow
    document.body.style.display = '';
  }, 10);
  
  // Dispatch a custom event that the ThemeProvider can listen for
  const event = new CustomEvent('themeToggled', { 
    detail: { isDark: !isDarkMode } 
  });
  document.dispatchEvent(event);
  
  return 'Theme toggled to: ' + (isDarkMode ? 'light' : 'dark');
};

// Log a message when the script is loaded
console.log('Theme toggle utility loaded. Call window.toggleTheme() to test theme switching.');
