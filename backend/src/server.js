// ========================================================================
// MAIN EXPRESS SERVER
// AURIXON Backend API
// ========================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


// Import routes
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import reportingPeriodRoutes from './routes/reportingPeriodRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import boundaryRoutes from './routes/boundaryRoutes.js';
import referenceRoutes from './routes/referenceRoutes.js';
import calculationRoutes from './routes/calculationRoutes.js';
import reportingRoutes from './routes/reportingRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import csrdRoutes from './routes/csrdRoutes.js';
import reportHistoryRoutes from './routes/reportHistoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errors.js';

// Import database utilities
import { testConnection } from './utils/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========================================================================
// MIDDLEWARE
// ========================================================================

// Webhook route needs raw body for Stripe signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Body parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS - Allow all origins for now
app.use(cors());

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================================================
// DATABASE CONNECTION TEST
// ========================================================================

// Test database connection on startup
const dbReady = await testConnection();
if (!dbReady) {
  console.error('[CRITICAL] Cannot connect to database');
  console.error('[ERROR] Please ensure DATABASE_URL is configured and PostgreSQL is running');
  process.exit(1);
}

console.log('[DB] Connected successfully');

// ========================================================================
// HEALTH CHECK
// ========================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// ========================================================================
// API ROUTES
// ========================================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/companies/:companyId/reporting-periods', reportingPeriodRoutes);
app.use('/api/companies/:companyId/activities', activityRoutes);
app.use('/api/boundaries', boundaryRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/csrd', csrdRoutes);
app.use('/api/reports/history', reportHistoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);



// ========================================================================
// ERROR HANDLING
// ========================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ========================================================================
// START SERVER
// ========================================================================

// Store server instance for testing
let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  AURIXON BACKEND API                          ║
║                                                                ║
║  Environment:        ${NODE_ENV.padEnd(39)}║
║  Port:               ${String(PORT).padEnd(39)}║
║  URL:                http://localhost:${String(PORT).padEnd(25)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}

// Export app and server for testing
app.server = server;

export default app;
