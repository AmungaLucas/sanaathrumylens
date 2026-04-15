// src/app/api/posts/[id]/comments/add/route.js
// POST: Add a comment to a post (auth required)
import { query, initDatabase } from '@/lib/db';
import { withAuth } from '@/lib/withAuth';
import { formatComment, successResponse, errorResponse } from '@/lib/apiHelper';

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

    // Parse request body
    const body = await request.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return errorResponse('Comment content is required', 400);
    }

    // Verify post exists
    const posts = await query(
      'SELECT id FROM posts WHERE id = ? AND status = ? AND is_deleted = 0',
      [postId, 'published']
    );
    if (!Array.isArray(posts) || posts.length === 0) {
      return errorResponse('Post not found', 404);
    }

    // If parentId is provided, verify it exists and belongs to the same post
    if (parentId) {
      const parentComment = await query(
        'SELECT id FROM comments WHERE id = ? AND post_id = ? AND is_deleted = 0',
        [Number(parentId), postId]
      );
      if (!Array.isArray(parentComment) || parentComment.length === 0) {
        return errorResponse('Parent comment not found', 404);
      }
    }

    // Get user info for the comment snapshot
    const userRow = await query(
      'SELECT display_name, avatar FROM users WHERE id = ?',
      [user.userId]
    );
    const userName = userRow?.[0]?.display_name || user.displayName || 'Anonymous';
    const userAvatar = userRow?.[0]?.avatar || user.avatar || null;

    // Insert comment
    const result = await query(
      `INSERT INTO comments (post_id, user_id, user_name, user_avatar, content, parent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'visible')`,
      [
        postId,
        user.userId,
        userName,
        userAvatar,
        content.trim(),
        parentId ? Number(parentId) : null,
      ]
    );

    // Increment comment count on the post
    await query(
      'UPDATE posts SET stats_comments = stats_comments + 1 WHERE id = ?',
      [postId]
    );

    // Increment comment count on user
    await query(
      'UPDATE users SET comments_count = comments_count + 1 WHERE id = ?',
      [user.userId]
    );

    // Fetch the inserted comment
    const inserted = await query(
      'SELECT * FROM comments WHERE id = ?',
      [result.insertId]
    );

    const comment = Array.isArray(inserted) && inserted.length > 0
      ? formatComment(inserted[0], false)
      : { id: result.insertId };

    return successResponse({ comment }, 201);
  } catch (err) {
    console.error('Error adding comment:', err);
    return errorResponse('Failed to add comment', 500);
  }
}
