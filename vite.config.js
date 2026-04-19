import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to add COOP header for Firebase Auth (only for HTML responses)
// COOP: same-origin-allow-popups allows popup windows for OAuth flows
const coopHeaderPlugin = {
  name: 'coop-header-plugin',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        // Only add COOP header for HTML requests, not API/JSON responses
        if (!req.url.includes('/api') && !req.url.match(/\.(js|css|json|png|jpg|svg)$/)) {
          const originalSend = res.send;
          res.send = function(data) {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            return originalSend.call(this, data);
          };
        }
        next();
      });
    };
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), coopHeaderPlugin],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
