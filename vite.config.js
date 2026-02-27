import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom API Middleware for development
const apiMiddleware = () => ({
  name: 'api-middleware',
  configureServer(server) {
    server.middlewares.use('/api/send-email', async (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};

            // Mock Express/Vercel response methods
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };

            // Dynamic import to support hot-reloading logic (though basic)
            const { default: handler } = await import('./api/send-email.js');
            await handler(req, res);
          } catch (e) {
            console.error("API Middleware Error:", e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Internal Server Error', error: e.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddleware()],
  base: process.env.VITE_BASE_PATH || "/",
})
