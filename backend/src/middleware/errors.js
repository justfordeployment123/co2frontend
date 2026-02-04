// ========================================================================
// ERROR HANDLING MIDDLEWARE
// Centralized error response formatting
// ========================================================================

/**
 * Middleware: Catch all errors and format response
 */
export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message, err.stack);

  // PostgreSQL errors
  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(409).json({
      error: 'Conflict',
      message: 'This value already exists',
    });
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid reference to related record',
    });
  }

  if (err.code === '23502') {
    // NOT NULL constraint violation
    return res.status(400).json({
      error: 'Bad request',
      message: 'Required field is missing',
    });
  }

  // Validation errors (custom)
  if (err.statusCode === 400) {
    return res.status(400).json({
      error: 'Bad request',
      message: err.message,
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
}

/**
 * Middleware: 404 handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    message: `${req.method} ${req.path} does not exist`,
  });
}
