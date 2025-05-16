# Transportation Company Scraper

A web application with React UI and Express.js backend that scrapes carrier data from the FMCSA SAFER System.

## Features

- Scrape carrier information using USDOT MC numbers
- Configurable start point and count
- Adjustable concurrency for faster scraping
- Progress tracking and detailed logs
- Export results to CSV

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
```

For production, update this to your production API URL.

## Project Structure

- `/src/ui` - React frontend components
- `/src/utils` - Utility functions and scraper service
- `/server.js` - Express.js backend
- `/dist` - Built frontend assets (after running build)
