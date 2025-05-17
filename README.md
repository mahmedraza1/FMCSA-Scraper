# Transportation Company Scraper

A web application with React UI and Express.js backend that scrapes carrier data from the FMCSA SAFER System.

## Features

- Scrape carrier information using USDOT MC numbers
- Configurable start point and count
- Adjustable concurrency for faster scraping
- Progress tracking and detailed logs
- Export results to CSV
- Dark/light theme support with consistent accent colors
- Session-based client management
- Proxy rotation system to prevent IP blocking
- Admin panel with authentication for managing proxies

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development Scripts

- `npm run dev:client` - Start Vite development server
- `npm run dev:server` - Start Express.js server with nodemon
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the React application
- `npm run start` - Start the production Express.js server

## Production Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Start the server:
   ```
   npm run start
   ```

3. Access the application at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_API_URL=http://localhost:3000/api
ADMIN_API_KEY=your-secure-api-key-here
ADMIN_USERNAME=mark
ADMIN_PASSWORD=mark@6275
```

For production, update these values to your production settings.

## Authentication

The admin panel at `/admin` is protected by authentication:
- Default username can be set using the ADMIN_USERNAME environment variable
- Default password can be set using the ADMIN_PASSWORD environment variable
- "Remember Me" option allows users to stay logged in across browser sessions
- Enhanced device fingerprinting for improved security

You can configure these values in the `.env` file:
```
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-secure-password
```

## Project Structure

- `/src/ui` - React frontend components
- `/src/utils` - Utility functions and scraper service
- `/src/config` - Configuration files
- `/public` - Static assets

## Proxy Management

The application supports using proxies to avoid IP blocking. To manage proxies:

1. Log in to the admin panel at `/admin`
2. Navigate to the Proxy Management tab
3. Enter your proxies (one per line) in the format `http://user:pass@host:port` or `http://host:port`
4. Click Configure Proxies to save and test them

Proxies are stored in a structured JSON file (`proxies.json`) and will be automatically rotated when requests fail.
You can also:
- Import proxy configurations from JSON files
- Export your current proxy configuration as a JSON file

This eliminates the need to manually edit text files for proxy configuration.
- `/server.js` - Express.js backend
- `/dist` - Built frontend assets (after running build)
