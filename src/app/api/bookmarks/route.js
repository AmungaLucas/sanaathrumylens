// src/app/api/bookmarks/route.js
// GET: Fetch authenticated user's bookmarked posts
import { query, initDatabase } from '@/lib/db';
import { withAuth } from '@/lib/withAuth';
import { formatPost, successResponse, errorResponse } from '@/lib/apiHelper';

let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function GET(request) {
  try {
    await ensureDb();

    // Check authentication
    const { authenticated, user } = await withAuth(request);
    if (!authenticated) {
      return errorResponse('Authentication required', 401);
    }

    // Fetch bookmarked posts with pagination
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const page = searchParams.get('page') || '1';

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM bookmarks WHERE user_id = ?',
      [user.userId]
    );
    const total = Array.isArray(countResult) && countResult.length > 0
      ? countResult[0].total
      : 0;

    // Fetch bookmarked posts
    const rows = await query(
      `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio,
              b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN posts p ON b.post_id = p.id
       LEFT JOIN authors a ON p.author_id = a.id
       WHERE b.user_id = ? AND p.status = 'published' AND p.is_deleted = 0
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [user.userId, parseInt(limit, 10), offset]
    );

    const posts = Array.isArray(rows)
      ? rows.map((row) => ({
          ...formatPost(row),
          bookmarkedAt: row.bookmarked_at ? new Date(row.bookmarked_at).toISOString() : null,
        }))
      : [];

    return successResponse({
      bookmarks: posts,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    return errorResponse('Failed to fetch bookmarks', 500);
  }
}
