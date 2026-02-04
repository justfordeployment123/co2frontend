// ========================================================================
// JWT UTILITIES
// Authentication token generation and verification
// ========================================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

/**
 * Generate JWT token for authenticated user
 * @param {Object} payload - User data to include in token
 * @returns {string} Signed JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
}

/**
 * Verify JWT token and return payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 * @param {string} authHeader - Authorization header value
 * @returns {string} Token or null
 */
export function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
