import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fetchFacebookPageData } from './server/fbService.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'asi-monitor-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            if (urlObj.pathname === '/api/page-info') {
              const targetUrl = urlObj.searchParams.get('url');
              if (!targetUrl) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'URL parameter is required' }));
              }
              const data = await fetchFacebookPageData(targetUrl);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(data));
            }
            
            if (urlObj.pathname === '/api/health') {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'ok', app: 'ASI Monitor Vite Middleware' }));
            }
          } catch (err) {
            console.error('[API Middleware Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
