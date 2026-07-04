/**
 * Main Server Entry Point
 * Express server configuration and startup
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');
const constants = require('./config/constants');
const { rateLimiter } = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// ============= MIDDLEWARE =============

// CORS - Allow all origins in development
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:19000').split(',').map(o => o.trim());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= ROUTES =============

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.status(constants.STATUS_CODES.OK).json({
    status: 'Server is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Database health check
 * GET /api/db-health
 */
app.get('/api/db-health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1');
    connection.release();
    
    res.status(constants.STATUS_CODES.OK).json({
      status: 'Database is connected',
      database: process.env.DATABASE_NAME,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(constants.STATUS_CODES.INTERNAL_ERROR).json({
      status: 'Database connection failed',
      error: error.message,
    });
  }
});

// Apply rate limiting to auth endpoints (5 attempts per 15 minutes)
app.use('/api/auth/login', rateLimiter(5, 15 * 60 * 1000));
app.use('/api/auth/send-otp', rateLimiter(5, 15 * 60 * 1000));
app.use('/api/auth/forgot-password', rateLimiter(3, 60 * 60 * 1000));

// Import route handlers
const authRoutes            = require('./routes/authRoutes');
const collectionRoutes      = require('./routes/collectionRoutes');
const loanCollectionRoutes  = require('./routes/loanCollectionRoutes');
const productConfigRoutes   = require('./routes/productConfigRoutes');
const paymentsGatewayRoutes = require('./routes/paymentsGatewayRoutes');
const expenseRoutes         = require('./routes/expenseRoutes');

// Mount routes — existing routes unchanged
app.use('/api/auth',            authRoutes);
app.use('/api/collections',     collectionRoutes);
app.use('/api/loan-collections', loanCollectionRoutes);
// New additive namespaces
app.use('/api/product-configs', productConfigRoutes);
app.use('/api/payments',        paymentsGatewayRoutes);
app.use('/api/expenses',        expenseRoutes);

// ============= ERROR HANDLING =============

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(constants.STATUS_CODES.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || constants.STATUS_CODES.INTERNAL_ERROR).json({
    success: false,
    message: constants.MESSAGES.SERVER_ERROR,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============= SERVER STARTUP =============

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║       🚀 POCKETOR BACKEND SERVER       ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:19000'}`);
  console.log(`📦 Database: ${process.env.DATABASE_NAME || 'pocketor_db'}`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📚 Available endpoints:');
  console.log('  • GET  /api/health');
  console.log('  • GET  /api/db-health');
  console.log('  • POST /api/auth/register');
  console.log('  • POST /api/auth/login');
  console.log('  • GET  /api/auth/me (protected)');
  console.log('  • POST /api/auth/logout (protected)');
  console.log('  • GET  /api/collections (protected)');
  console.log('  • POST /api/collections (protected)');
  console.log('  • GET  /api/collections/:id (protected)');
  console.log('  • PUT  /api/collections/:id (protected)');
  console.log('  • DELETE /api/collections/:id (protected)');
  console.log('  • Loan Collections: /api/loan-collections/* (protected)');
  console.log('    - Lines, Areas, Customers, Loans, Payments');
  console.log('  • Product Configs:  /api/product-configs/* (protected)');
  console.log('    - CRUD, POST /:id/approve, POST /:id/archive, POST /:id/calc');
  console.log('    - GET  /ledger/entries');
  console.log('  • Payments Gateway: /api/payments/* ');
  console.log('    - POST /initiate (protected), POST /webhook (public+signed)');
  console.log('  • Expenses: /api/expenses/* (protected)');
  console.log('    - GET / (filter by ?category=&startDate=&endDate=)');
  console.log('    - GET /summary, POST /, PUT /:id, DELETE /:id');
  console.log('\n✅ Ready to receive requests!\n');
});

module.exports = app;
