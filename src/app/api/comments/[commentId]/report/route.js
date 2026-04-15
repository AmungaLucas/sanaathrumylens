// src/app/api/comments/[commentId]/report/route.js
// POST: Report a comment (auth required)
import { query, initDatabase } from '@/lib/db';
import { withAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/lib/apiHelper';

let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function POST(request, { params }) {
  try {
    await ensureDb();
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

    // Verify comment exists
    const comments = await query(
      'SELECT id, user_id FROM comments WHERE id = ? AND is_deleted = 0',
      [cid]
    );
    if (!Array.isArray(comments) || comments.length === 0) {
      return errorResponse('Comment not found', 404);
    }

    // Prevent self-reporting
    if (comments[0].user_id === user.userId) {
      return errorResponse('You cannot report your own comment', 400);
    }

    // Check if already reported
    const existing = await query(
      'SELECT id FROM comment_reports WHERE comment_id = ? AND reporter_id = ?',
      [cid, user.userId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return successResponse({ reported: true, message: 'Comment already reported' });
    }

    // Insert report
    await query(
      'INSERT INTO comment_reports (comment_id, reporter_id, reported_user_id) VALUES (?, ?, ?)',
      [cid, user.userId, comments[0].user_id]
    );

    return successResponse({ reported: true }, 201);
  } catch (err) {
    console.error('Error reporting comment:', err);
    return errorResponse('Failed to report comment', 500);
  }
}
