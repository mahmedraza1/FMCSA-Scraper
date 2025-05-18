# Transportation Company Scraper

A web application with React UI and Express.js backend th## Security Features

This application includes balanced security measures to protect data while maintaining a good user experience:

- **Anti-Developer Tools Protection**: Blocks all right-clicks and keyboard shortcuts that open developer tools
- **Server-Side Security Logging**: Logs security events with detailed information for audit trails
- **Code Obfuscation**: Production builds use advanced code obfuscation to prevent reverse engineering
- **Secure API Communication**: All API endpoints use appropriate security measuresrrier data from the FMCSA SAFER System.

## Features

- Scrape carrier information using USDOT MC numbers
- Configurable start point and count
- Admin-controlled concurrency settings for resource management
- Progress tracking and detailed logs
- Export results to CSV
- Dark/light theme support with consistent accent colors
- Session-based client management
- Proxy rotation system to prevent IP blocking
- Admin panel with authentication for managing proxies
- Enhanced security measures to prevent unauthorized access and inspection

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
- `npm run dev:server` - Start Express.js server with hot reloading
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the React application for standard deployment
- `npm run build:secure` - Build with enhanced security measures for production
- `npm run start` - Start the Express.js server
- `npm run start:prod` - Start the server in production mode

## Production Deployment

### Standard Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm run start
   ```

### Secure Deployment

For production environments where security is a priority:

1. Build the application with security measures:
   ```bash
   npm run build:secure
   ```

2. Start the server in production mode:
   ```bash
   npm run start:prod
   ```

### Production Deployment with Security Measures

For a production environment with enhanced security including anti-developer tools protection:

1. Run the combined deploy script:
   ```bash
   npm run deploy
   ```

This script:
- Builds the application with all security measures enabled
- Starts the server in production mode with anti-DevTools protection active

Alternatively, you can run the steps separately:
```bash
# 1. Build with security measures
npm run build:secure

# 2. Start in production mode
npm run start:prod
```

## Security Features

This application includes advanced security measures to protect data and prevent unauthorized access:

- **Anti-Developer Tools Protection**: Prevents inspection and tampering with application code in browsers
- **Keyboard Shortcut Blocking**: Disables common browser shortcuts used to access debugging tools
- **Tamper Detection**: Identifies and reports attempts to modify security protections
- **Server-Side Security Logging**: Logs security events with detailed information for audit trails
- **Code Obfuscation**: Production builds use advanced code obfuscation to prevent reverse engineering
- **Print/Screenshot Prevention**: Blocks attempts to print or take screenshots of sensitive data
- **Right-Click Prevention**: Disables browser context menu to prevent inspection features
- **Console Protection**: Prevents access to browser developer console
- **Secure API Communication**: All API endpoints use appropriate security measures

### Production Security

For production deployment, use the secure build process:

```
npm run build:secure
NODE_ENV=production npm run start:prod
```

This activates all security features and performs additional code protection measures.

3. Access the application at `http://localhost:3001`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

``` JSON
VITE_API_URL=http://localhost:3001/api
ADMIN_API_KEY=your-secure-api-key-here
ADMIN_USERNAME= [Your Username Here]
ADMIN_PASSWORD= [Your Password Here]
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

## Customizing Security Settings

The application includes minimal security measures that can be customized based on your needs:

### Adjusting Anti-DevTools Protection

To customize the anti-developer tools protection, edit the initialization in `src/ui/main.jsx`:

```jsx
initAntiDevTools({
  disableRightClick: true,     // Block all right-clicks sitewide
  disableKeyboardShortcuts: true, // Block developer keyboard shortcuts
  forceEnable: true,          // Force enable even in development
});
```

### Disabling Security Features

For development or internal use where security is less critical, you can disable specific features:

1. Set `forceEnable: false` to disable protection in development mode
2. Set individual protection features to `false` to disable them
3. In extreme cases, you can comment out the `initAntiDevTools()` call entirely

These settings provide a balance between security and user experience.
