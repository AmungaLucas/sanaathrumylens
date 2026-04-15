// src/app/api/posts/by-tag/[slug]/route.js
// GET: Fetch posts by tag slug
import { query, initDatabase } from '@/lib/db';
import { formatPost, successResponse, errorResponse } from '@/lib/apiHelper';

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
    const { slug } = await params;

    if (!slug) {
      return errorResponse('Tag slug is required', 400);
    }

    const decodedSlug = decodeURIComponent(slug);

    // Fetch posts where the tags JSON field contains this tag slug
    const rows = await query(
      `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
       FROM posts p
       LEFT JOIN authors a ON p.author_id = a.id
       WHERE p.status = 'published' AND p.is_deleted = 0
         AND p.tags LIKE ?
       ORDER BY p.published_at DESC`,
      [`%"${decodedSlug}"%`]
    );

    const posts = Array.isArray(rows)
      ? rows.map(formatPost)
      : [];

    return successResponse({ posts, tag: decodedSlug });
  } catch (err) {
    console.error('Error fetching posts by tag:', err);
    return errorResponse('Failed to fetch posts by tag', 500);
  }
}
