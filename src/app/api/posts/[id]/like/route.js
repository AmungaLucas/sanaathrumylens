// src/app/api/posts/[id]/like/route.js
// POST: Toggle like on a post (auth required)
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
    const { id } = await params;

    // Check authentication
    const { authenticated, user } = await withAuth(request);
    if (!authenticated) {
      return errorResponse('Authentication required', 401);
    }

    if (!id) {
      return errorResponse('Post ID is required', 400);
    }

    const postId = Number(id);

    // Verify post exists
    const posts = await query(
      'SELECT id FROM posts WHERE id = ? AND status = ? AND is_deleted = 0',
      [postId, 'published']
    );
    if (!Array.isArray(posts) || posts.length === 0) {
      return errorResponse('Post not found', 404);
    }

    // Check if already liked
    const existing = await query(
      'SELECT id, is_deleted FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, user.userId]
    );

    if (Array.isArray(existing) && existing.length > 0 && !existing[0].is_deleted) {
      // Unlike: soft-delete the like
      await query(
        'UPDATE post_likes SET is_deleted = 1 WHERE post_id = ? AND user_id = ?',
        [postId, user.userId]
      );
      // Decrement like count
      await query(
        'UPDATE posts SET stats_likes = GREATEST(stats_likes - 1, 0) WHERE id = ?',
        [postId]
      );
      return successResponse({ liked: false });
    } else if (Array.isArray(existing) && existing.length > 0 && existing[0].is_deleted) {
      // Re-like: restore the soft-deleted like
      await query(
        'UPDATE post_likes SET is_deleted = 0 WHERE post_id = ? AND user_id = ?',
        [postId, user.userId]
      );
      // Increment like count
      await query(
        'UPDATE posts SET stats_likes = stats_likes + 1 WHERE id = ?',
        [postId]
      );
      return successResponse({ liked: true });
    } else {
      // New like
      await query(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [postId, user.userId]
      );
      // Increment like count
      await query(
        'UPDATE posts SET stats_likes = stats_likes + 1 WHERE id = ?',
        [postId]
      );
      return successResponse({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return errorResponse('Failed to toggle like', 500);
  }
}
