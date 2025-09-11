import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import serverless from 'serverless-http';
import database from './utils/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import extractRoutes from './routes/extract.routes';
import invoicesRoutes from './routes/invoices.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001';

// Database connection helper for serverless
const ensureDatabaseConnection = async () => {
  try {
    await database.connect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Middleware to ensure database connection before API calls
const databaseMiddleware = async (_req: any, res: any, next: any) => {
  if (!database.isConnectedToDatabase()) {
    console.log('🔗 Database not connected, attempting to connect...');
    const connected = await ensureDatabaseConnection();
    if (!connected) {
      return res.status(503).json({
        success: false,
        error: 'Database connection failed. Please try again.',
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for PDF viewer
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'", "http://localhost:3001", "http://localhost:3000"]
      }
    }
  })
);

// CORS configuration
const allowedOrigins = CORS_ORIGIN === '*' ? [] : CORS_ORIGIN.split(',').map(origin => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (CORS_ORIGIN === '*') {
        // Allow all origins (testing only)
        callback(null, true);
      } else if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow listed origins
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check endpoints
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'PDF Review Dashboard API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: database.isConnectedToDatabase() ? 'connected' : 'disconnected'
  });
});

app.get('/health', async (_req, res) => {
  if (!database.isConnectedToDatabase()) {
    await ensureDatabaseConnection();
  }

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: database.isConnectedToDatabase(),
      state: database.getConnectionState()
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes (with database middleware)
app.use('/api/auth', databaseMiddleware, authRoutes);
app.use('/api/upload', databaseMiddleware, uploadRoutes);
app.use('/api/extract', databaseMiddleware, extractRoutes);
app.use('/api/invoices', databaseMiddleware, invoicesRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const startServer = async (): Promise<void> => {
    try {
      await database.connect();

      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 CORS enabled for: ${CORS_ORIGIN}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  if (require.main === module) {
    startServer();
  }
}

// Export for serverless deployment (Vercel)
export default serverless(app);

// Export app for testing or local dev
export { app };
