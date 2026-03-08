import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate, optionalAuth } from './middleware/auth.js';

// Initialize environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true, // Allow cookies
}));
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Parse cookies

// Root endpoint - API info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Skynet EPR Backend',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      people: '/api/people',
      epr: '/api/epr'
    },
    auth: 'Use /api/auth/login to authenticate. Tokens stored in HTTP-only cookies.'
  });
});

// Health Check (public - no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth Routes (public and protected)
app.use('/api/auth', authRoutes);

// Protected API Routes - require authentication
app.use('/api', authenticate, apiRoutes);

// Global Error Handling Middleware
// This must be the last middleware to catch all errors from the routes
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`
  🚀 Skynet EPR Backend is running!
  📡 URL: http://localhost:${PORT}
  🛠️  Health Check: http://localhost:${PORT}/health
  `);
});

export default app;