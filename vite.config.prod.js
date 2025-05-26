// Additional production security measures for Vite build
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    build: {
      // Minify for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          // Remove debugger statements
          drop_debugger: true,
          // Advanced optimizations
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          // Mangle variable and function names
          toplevel: true,
          safari10: true,
          // Additional name mangling options
          properties: {
            // Mangle property names
            regex: /^_/,
            reserved: ['__proto__', 'prototype']
          },
        },
        output: {
          // Remove comments
          comments: false,
          // Make readable output impossible with weird characters
          ascii_only: true,
          // Beautify off
          beautify: false,
        },
        // Advanced obfuscation
        nameCache: null,
        ie8: false,
        safari10: true,
      },
      // Generate JavaScript sourcemaps but don't include them in the build
      sourcemap: false,
    },
    // Set base path for deployment (adjust as needed for your production environment)
    base: '/',
    // Define additional global replacements
    define: {
      // Replace process.env.NODE_ENV with 'production' in production builds
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Define any other constants needed in the app
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    }
  };
});
