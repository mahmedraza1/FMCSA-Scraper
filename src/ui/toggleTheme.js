/**
 * This utility has been modified to enforce light mode only
 * The toggleTheme function is kept for compatibility but now only ensures light mode is set
 */

// Expose the function globally for compatibility
window.toggleTheme = function() {
  // Always ensure light mode is active
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  localStorage.setItem('theme', 'light');
  console.log('Light mode enforced (dark mode has been disabled)');
  
  
  // Force a refresh of CSS variables by triggering a reflow with a delay
  document.body.style.display = 'none';
  setTimeout(() => {
    document.body.offsetHeight; // Force reflow
    document.body.style.display = '';
  }, 10);
  
  // Dispatch a custom event for compatibility, always with isDark=false
  const event = new CustomEvent('themeToggled', { 
    detail: { isDark: false } 
  });
  document.dispatchEvent(event);
  
  return 'Light mode enforced (dark mode has been disabled)';
};

// Log a message when the script is loaded
console.log('Light mode utility loaded. Dark mode has been disabled.');
