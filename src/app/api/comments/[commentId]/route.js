// src/app/api/comments/[commentId]/route.js
// PUT: Update a comment (auth required, must be owner or admin)
// DELETE: Soft-delete a comment (auth required, must be owner or admin)
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

/**
 * Check if user is owner or has admin/editor/moderator role
 */
function canModify(user, commentUserId) {
  if (!user) return false;
  // Check roles
  const roles = user.roles || [];
  if (roles.includes('admin') || roles.includes('editor') || roles.includes('moderator')) {
    return true;
  }
  // Check ownership
  return user.userId === commentUserId;
}

export async function PUT(request, { params }) {
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

    // Get existing comment
    const existing = await query(
      'SELECT * FROM comments WHERE id = ? AND is_deleted = 0',
      [cid]
    );
    if (!Array.isArray(existing) || existing.length === 0) {
      return errorResponse('Comment not found', 404);
    }

    const comment = existing[0];

    // Check permissions
    if (!canModify(user, comment.user_id)) {
      return errorResponse('You do not have permission to edit this comment', 403);
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return errorResponse('Comment content is required', 400);
    }

    // Update comment
    await query(
      `UPDATE comments SET content = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [content.trim(), cid]
    );

    // Fetch updated comment
    const updated = await query(
      'SELECT * FROM comments WHERE id = ?',
      [cid]
    );

    const formatted = Array.isArray(updated) && updated.length > 0
      ? formatComment(updated[0])
      : null;

    return successResponse({ comment: formatted });
  } catch (err) {
    console.error('Error updating comment:', err);
    return errorResponse('Failed to update comment', 500);
  }
}

export async function DELETE(request, { params }) {
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

    // Get existing comment
    const existing = await query(
      'SELECT * FROM comments WHERE id = ? AND is_deleted = 0',
      [cid]
    );
    if (!Array.isArray(existing) || existing.length === 0) {
      return errorResponse('Comment not found', 404);
    }

    const comment = existing[0];

    // Check permissions
    if (!canModify(user, comment.user_id)) {
      return errorResponse('You do not have permission to delete this comment', 403);
    }

    // Soft-delete the comment
    await query(
      'UPDATE comments SET is_deleted = 1, content = "[deleted]", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cid]
    );

    // Also soft-delete all replies
    await query(
      'UPDATE comments SET is_deleted = 1, content = "[deleted]" WHERE parent_id = ? AND is_deleted = 0',
      [cid]
    );

    // Decrement comment count on the post
    await query(
      'UPDATE posts SET stats_comments = GREATEST(stats_comments - 1, 0) WHERE id = ?',
      [comment.post_id]
    );

    // Decrement comment count on user
    if (comment.user_id) {
      await query(
        'UPDATE users SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?',
        [comment.user_id]
      );
    }

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return errorResponse('Failed to delete comment', 500);
  }
}
