// src/lib/auth.js
// JWT authentication utility library
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sanaa-super-secret-key-change-in-production-2024';
const JWT_EXPIRES_IN = '7d'; // 7 days

/**
 * Generate a JWT token with the given payload
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token and return the decoded payload
 * Returns null if the token is invalid or expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request cookies
 */
export function getTokenFromCookie(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

/**
 * Create a session cookie object for setting in response headers
 */
export function createSessionCookie(token) {
  return {
    name: 'token',
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

/**
 * Create a cookie object that clears the session token
 */
export function createClearCookie() {
  return {
    name: 'token',
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    },
  };
}

export { JWT_SECRET };
