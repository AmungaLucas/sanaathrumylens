// src/app/api/comments/[commentId]/replies/route.js
// GET: Fetch replies for a comment
import { query, initDatabase } from '@/lib/db';
import { formatComment, successResponse, errorResponse } from '@/lib/apiHelper';
import { withAuth } from '@/lib/withAuth';

let dbReady = false;
let dbAvailable = false;
async function ensureDb() {
  if (!dbReady) {
    dbAvailable = await initDatabase();
    dbReady = true;
  }
  return dbAvailable;
}

export async function GET(request, { params }) {
  try {
    const dbOk = await ensureDb();
    if (!dbOk) {
      return successResponse({ replies: [] });
    }
    const { commentId } = await params;

    if (!commentId) {
      return errorResponse('Comment ID is required', 400);
    }

    const cid = Number(commentId);

    // Check authentication (optional - to show likedByUser status)
    const { authenticated, user } = await withAuth(request);

    // Verify parent comment exists
    const parentComments = await query(
      'SELECT id FROM comments WHERE id = ? AND is_deleted = 0',
      [cid]
    );
    if (!Array.isArray(parentComments) || parentComments.length === 0) {
      return errorResponse('Comment not found', 404);
    }

    // Fetch replies sorted by oldest first
    const rows = await query(
      `SELECT c.*, cl.id as user_liked
       FROM comments c
       LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = ?
       WHERE c.parent_id = ? AND c.is_deleted = 0 AND c.status = 'visible'
       ORDER BY c.created_at ASC`,
      authenticated ? [user.userId, cid] : [null, cid]
    );

    if (!Array.isArray(rows)) {
      return successResponse({ replies: [] });
    }

    const replies = rows.map((row) => formatComment(row, !!row.user_liked));

    return successResponse({ replies });
  } catch (err) {
    console.error('Error fetching replies:', err);
    return errorResponse('Failed to fetch replies', 500);
  }
}
