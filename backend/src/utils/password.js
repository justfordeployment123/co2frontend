// ========================================================================
// PASSWORD UTILITIES
// Hashing and verification with bcrypt
// ========================================================================

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash plaintext password
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify plaintext password against hash
 * @param {string} password - Plaintext password to check
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
