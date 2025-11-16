import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import commitmentRoutes from './routes/commitment.routes';
import wallRoutes from './routes/wall.routes';
import progressRoutes from './routes/progress.routes';
import socialRoutes from './routes/social.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/commitments', commitmentRoutes);
app.use('/api/wall', wallRoutes);
app.use('/api', progressRoutes); // Includes dashboard and progress routes
app.use('/api', socialRoutes); // Includes notifications, challenges, organizations, admin
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
