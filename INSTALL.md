# Installation and Deployment Guide

This guide will help you install and deploy the Carrier Data Scraper as a web application.

## Local Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   This will start both the Vite frontend development server and the Express.js backend server.

3. **Access the Application**

   Open your browser and navigate to: [http://localhost:5173](http://localhost:5173)

## Production Deployment

### Deployment Steps

1. **Build the Frontend**

   ```bash
   npm run build
   ```

2. **Start the Production Server**

   ```bash
   npm run start
   ```

3. **Access the Application**

   Open your browser and navigate to: [http://localhost:5175](http://localhost:5175)

## Environment Variables

You can customize the application by setting the following environment variables:

- `PORT`: The port on which the server will listen (default: 3001)
- `VITE_API_URL`: The URL for the API endpoints (default: http://localhost:3001/api)

## Troubleshooting

- **API Connection Issues**: Ensure the API URL is correctly set in the `.env` file
- **CORS Errors**: The server has CORS enabled by default for all origins in development
- **Database Errors**: This application does not use a database, all data is processed in memory
