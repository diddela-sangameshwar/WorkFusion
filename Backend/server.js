require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const initializeSocket = require('./src/socket');
const automationEngine = require('./src/automation/engine');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const progressRoutes = require('./src/routes/progressRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const automationRoutes = require('./src/routes/automationRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin:process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket
initializeSocket(io);

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'WorkFusion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/automation', automationRoutes);

// Scoring endpoint
const scoringEngine = require('./src/services/scoringEngine');
const authenticate = require('./src/middleware/auth');

app.get('/api/scoring/:userId', authenticate, async (req, res, next) => {
  try {
    const result = await scoringEngine.calculateScore(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.get('/api/scoring/:userId/predict', authenticate, async (req, res, next) => {
  try {
    const result = await scoringEngine.predictScore(req.params.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`\n🚀 WorkFusion Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
    });

    // Start automation engine
    automationEngine.init();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  automationEngine.stop();
  server.close(() => process.exit(0));
});
