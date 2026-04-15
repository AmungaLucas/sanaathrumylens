// src/app/api/posts/[id]/bookmark/route.js
// POST: Toggle bookmark on a post (auth required)
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

    // Check if already bookmarked
    const existing = await query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?',
      [user.userId, postId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Remove bookmark
      await query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [user.userId, postId]);
      // Decrement bookmark count on user
      await query(
        'UPDATE users SET bookmarks_count = GREATEST(bookmarks_count - 1, 0) WHERE id = ?',
        [user.userId]
      );
      return successResponse({ bookmarked: false });
    } else {
      // Add bookmark
      await query(
        'INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)',
        [user.userId, postId]
      );
      // Increment bookmark count on user
      await query(
        'UPDATE users SET bookmarks_count = bookmarks_count + 1 WHERE id = ?',
        [user.userId]
      );
      return successResponse({ bookmarked: true });
    }
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    return errorResponse('Failed to toggle bookmark', 500);
  }
}
