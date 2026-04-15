// src/app/api/posts/[id]/comments/route.js
// GET: Fetch comments for a post
import { query, initDatabase } from '@/lib/db';
import { formatComment, successResponse, errorResponse } from '@/lib/apiHelper';
import { withAuth } from '@/lib/withAuth';

let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function GET(request, { params }) {
  try {
    await ensureDb();
    const { id } = await params;

    if (!id) {
      return errorResponse('Post ID is required', 400);
    }

    const postId = Number(id);

    // Check authentication (optional - to show likedByUser status)
    const { authenticated, user } = await withAuth(request);

    // Fetch top-level comments (no parent_id) sorted by newest
    const rows = await query(
      `SELECT c.*, cl.id as user_liked
       FROM comments c
       LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = ?
       WHERE c.post_id = ? AND c.parent_id IS NULL AND c.is_deleted = 0 AND c.status = 'visible'
       ORDER BY c.created_at DESC`,
      authenticated ? [user.userId, postId] : [null, postId]
    );

    if (!Array.isArray(rows)) {
      return successResponse({ comments: [] });
    }

    const comments = rows.map((row) => formatComment(row, !!row.user_liked));

    return successResponse({ comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return errorResponse('Failed to fetch comments', 500);
  }
}
