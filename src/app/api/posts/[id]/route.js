// src/app/api/posts/[id]/route.js
// GET: Fetch a single post by slug or ID
import { query, initDatabase } from '@/lib/db';
import { formatPost, successResponse, errorResponse } from '@/lib/apiHelper';

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
      return errorResponse('Post not found', 404);
    }
    const { id } = await params;

    if (!id) {
      return errorResponse('Post ID or slug is required', 400);
    }

    // Try to find by slug first, then by numeric ID
    let rows;
    if (isNaN(Number(id))) {
      // It's a slug
      rows = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
         FROM posts p
         LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.slug = ? AND p.status = 'published' AND p.is_deleted = 0
         LIMIT 1`,
        [id]
      );
    } else {
      // It's a numeric ID
      rows = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
         FROM posts p
         LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.id = ? AND p.status = 'published' AND p.is_deleted = 0
         LIMIT 1`,
        [Number(id)]
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('Post not found', 404);
    }

    const post = formatPost(rows[0]);

    // Increment view count (fire-and-forget)
    query('UPDATE posts SET stats_views = stats_views + 1 WHERE id = ?', [rows[0].id]).catch(() => {});

    return successResponse(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    return errorResponse('Failed to fetch post', 500);
  }
}
