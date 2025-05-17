import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Authentication configuration
 * In a production environment, these values should be loaded from environment variables
 */

// Get credentials from environment variables with fallbacks
const adminCredentials = {
  username: process.env.ADMIN_USERNAME || 'mark',
  password: process.env.ADMIN_PASSWORD || 'mark@6275',
};

export { adminCredentials };
