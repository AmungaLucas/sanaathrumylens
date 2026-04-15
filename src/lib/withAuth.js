// src/lib/withAuth.js
// Auth middleware helper for API routes
import { getTokenFromCookie, verifyToken } from './auth';

/**
 * Check authentication from request cookies
 * @param {Request} request - Next.js request object
 * @returns {{ authenticated: boolean, user: object|null }}
 */
export async function withAuth(request) {
  const token = getTokenFromCookie(request);
  if (!token) return { authenticated: false, user: null };

  const decoded = verifyToken(token);
  if (!decoded) return { authenticated: false, user: null };

  return { authenticated: true, user: decoded };
}
