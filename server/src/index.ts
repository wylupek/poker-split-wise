import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import playerRoutes from './routes/players.js';
import sessionRoutes from './routes/sessions.js';
import settingsRoutes from './routes/settings.js';
import presetsRoutes from './routes/presets.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDatabase } from './config/database.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [FRONTEND_URL];

// Initialize database on startup
getDatabase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? (origin, callback) => callback(null, true) // Allow all origins in development
    : ALLOWED_ORIGINS,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/players', playerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/presets', presetsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`🌐 Local network: http://192.168.1.100:${PORT}`);
  console.log(`🎯 Frontend URL: ${FRONTEND_URL}\n`);
});
