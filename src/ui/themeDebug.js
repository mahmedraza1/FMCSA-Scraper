/**
 * This file contains helper functions to debug theme issues.
 * These functions will be attached to the window object.
 */

// Function to check theme status
window.checkThemeStatus = function() {
  const isDark = document.documentElement.classList.contains('dark');
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  console.log('=== Theme Status Report ===');
  console.log('Dark mode class on document:', isDark ? 'YES' : 'NO');
  console.log('Theme stored in localStorage:', storedTheme || 'NOT SET');
  console.log('System prefers dark:', systemPrefersDark ? 'YES' : 'NO');
  console.log('colorScheme CSS property:', document.documentElement.style.colorScheme);
  
  // Check CSS variables
  const style = getComputedStyle(document.documentElement);
  console.log('--bg-color:', style.getPropertyValue('--bg-color'));
  console.log('--accent:', style.getPropertyValue('--accent'));
  
  return {
    isDark,
    storedTheme,
    systemPrefersDark,
    colorScheme: document.documentElement.style.colorScheme,
    variables: {
      bgColor: style.getPropertyValue('--bg-color'),
      accent: style.getPropertyValue('--accent')
    }
  };
};

// Function to force dark mode
window.setDarkMode = function() {
  document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = 'dark';
  localStorage.setItem('theme', 'dark');
  console.log('Dark mode forced');
  return true;
};

// Function to force light mode
window.setLightMode = function() {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  localStorage.setItem('theme', 'light');
  console.log('Light mode forced');
  return true;
};

console.log('Theme debugging tools loaded! Use window.checkThemeStatus(), window.setDarkMode(), or window.setLightMode() to debug theme issues.');
