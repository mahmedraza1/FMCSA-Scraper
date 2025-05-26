/**
 * Simplified Anti-DevTools - Utility to prevent basic developer tools access
 * 
 * This utility implements simple protections to block common ways of accessing developer tools:
 * 1. Blocks right-clicks on protected elements to prevent inspection
 * 2. Blocks keyboard shortcuts that would open developer tools
 * 
 * This is a simplified version that won't interfere with normal user interactions.
 */

/**
 * Initialize anti-devtools protections
 * @param {Object} options Configuration options
 * @param {boolean} options.disableRightClick Disable right-click on protected elements
 * @param {boolean} options.disableKeyboardShortcuts Block dev tool keyboard shortcuts
 * @param {boolean} options.forceEnable Force enable in any environment
 * @param {Function} options.onDevToolsOpen Callback when devtools shortcut is blocked
 */
export function initAntiDevTools(options = {}) {
  // Default options
  const settings = {
    disableRightClick: true,
    disableKeyboardShortcuts: true,
    forceEnable: false,
    onDevToolsOpen: null,
    ...options
  };

  // Only run in production mode or if forceEnable is true
  if (import.meta.env.MODE !== 'production' && !settings.forceEnable) {
    return;
  }

  // 1. Disable right-click on protected elements
  if (settings.disableRightClick) {
    disableRightClick();
  }
  
  // 2. Block keyboard shortcuts
  if (settings.disableKeyboardShortcuts) {
    blockDevToolsShortcuts(settings.onDevToolsOpen);
  }
}

// Disable right-click context menu completely
function disableRightClick() {
  document.addEventListener('contextmenu', function(e) {
    // Block all right-clicks sitewide
    e.preventDefault();
    return false;
  });
}

// Block common keyboard shortcuts used for developer tools only
function blockDevToolsShortcuts(onDevToolsOpenCallback) {
  window.addEventListener('keydown', function(e) {
    let isDevToolsShortcut = false;

    // F12 key - Developer Tools
    if (e.key === 'F12') {
      isDevToolsShortcut = true;
    }
    
    // Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      isDevToolsShortcut = true;
    }
    
    // Ctrl+Shift+J / Cmd+Option+J (JavaScript Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      isDevToolsShortcut = true;
    }
    
    // Ctrl+Shift+C / Cmd+Option+C (Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      isDevToolsShortcut = true;
    }
    
    if (isDevToolsShortcut) {
      e.preventDefault();
      
      // Call the callback if provided
      if (typeof onDevToolsOpenCallback === 'function') {
        onDevToolsOpenCallback();
      }
      
      return false;
    }
  }, true);
}

// Reset for testing purposes (not used in production)
export function resetAntiDevTools() {
  // Nothing to reset in this simplified version
}
