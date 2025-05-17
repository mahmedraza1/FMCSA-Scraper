// Configuration for application-wide settings
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Default settings
const defaultSettings = {
  concurrencyLimit: 5,              // Default concurrency limit for scraping
  maxConcurrencyLimit: 20,          // Maximum allowed concurrency limit
  maxRecordsPerScrape: 1000,        // Maximum records that can be scraped in one request
  saveResultsAutomatically: false,  // Whether to save results automatically when scraping completes
  defaultStartMcNumber: 1635500     // Default starting MC number for scraping
};

// Path to settings file
const settingsFilePath = path.join(process.cwd(), 'appsettings.json');

// Function to get current settings
export function getSettings() {
  try {
    // Check if settings file exists
    if (fs.existsSync(settingsFilePath)) {
      const settings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      // Merge with default settings to ensure all required fields exist
      return { ...defaultSettings, ...settings };
    } else {
      // If file doesn't exist, create it with default settings
      saveSettings(defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error reading settings file:', error);
    return defaultSettings;
  }
}

// Function to save settings
export function saveSettings(settings) {
  try {
    // Merge with current settings to ensure we don't overwrite unrelated settings
    const currentSettings = getSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    // Write settings to file
    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Update a specific setting
export function updateSetting(key, value) {
  try {
    const settings = getSettings();
    settings[key] = value;
    return saveSettings(settings);
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
}

// Get a specific setting
export function getSetting(key) {
  try {
    const settings = getSettings();
    return settings[key] !== undefined ? settings[key] : defaultSettings[key];
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultSettings[key];
  }
}
