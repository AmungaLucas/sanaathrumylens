// src/app/api/comments/[commentId]/like/route.js
// POST: Toggle like on a comment (auth required)
import { query, initDatabase } from '@/lib/db';
import { withAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/lib/apiHelper';

let dbReady = false;
let dbAvailable = false;
async function ensureDb() {
  if (!dbReady) {
    dbAvailable = await initDatabase();
    dbReady = true;
  }
  return dbAvailable;
}

export async function POST(request, { params }) {
  try {
    const dbOk = await ensureDb();
    if (!dbOk) {
      return errorResponse('Service temporarily unavailable', 503);
    }
    const { commentId } = await params;

    // Check authentication
    const { authenticated, user } = await withAuth(request);
    if (!authenticated) {
      return errorResponse('Authentication required', 401);
    }

    if (!commentId) {
      return errorResponse('Comment ID is required', 400);
    }

    const cid = Number(commentId);

    // Verify comment exists and is visible
    const comments = await query(
      'SELECT id FROM comments WHERE id = ? AND is_deleted = 0 AND status = ?',
      [cid, 'visible']
    );
    if (!Array.isArray(comments) || comments.length === 0) {
      return errorResponse('Comment not found', 404);
    }

    // Check if already liked
    const existing = await query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [cid, user.userId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Unlike: remove the like
      await query(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [cid, user.userId]
      );
      // Decrement like count
      await query(
        'UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = ?',
        [cid]
      );
      return successResponse({ liked: false });
    } else {
      // New like
      await query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [cid, user.userId]
      );
      // Increment like count
      await query(
        'UPDATE comments SET likes = likes + 1 WHERE id = ?',
        [cid]
      );
      return successResponse({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling comment like:', err);
    return errorResponse('Failed to toggle comment like', 500);
  }
}
