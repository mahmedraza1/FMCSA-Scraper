/**
 * This file contains helper functions to debug theme issues.
 * These functions will be attached to the window object.
 * Modified to support light mode only.
 */

// Function to check theme status
window.checkThemeStatus = function() {
  // Always light mode now
  const isDark = false;
  const storedTheme = localStorage.getItem('theme'); // Should be 'light'
  
  console.log('=== Theme Status Report ===');
  console.log('Using light mode only (dark mode disabled)');
  console.log('Theme stored in localStorage:', storedTheme || 'NOT SET');
  console.log('colorScheme CSS property:', document.documentElement.style.colorScheme);
  
  // Check CSS variables
  const style = getComputedStyle(document.documentElement);
  console.log('--bg-color:', style.getPropertyValue('--bg-color'));
  console.log('--accent:', style.getPropertyValue('--accent'));
  
  return {
    isDark: false,
    storedTheme,
    colorScheme: document.documentElement.style.colorScheme,
    variables: {
      bgColor: style.getPropertyValue('--bg-color'),
      accent: style.getPropertyValue('--accent')
    }
  };
};

// Function to ensure light mode (dark mode removed)
window.setLightMode = function() {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  localStorage.setItem('theme', 'light');
  console.log('Light mode enforced (this is the only mode available)');
  return true;
};

// Alias for backward compatibility
window.setDarkMode = function() {
  console.log('Dark mode is disabled. Using light mode instead.');
  window.setLightMode();
  return false;
};

console.log('Theme debugging tools loaded! Note: This app now only uses light mode.');
