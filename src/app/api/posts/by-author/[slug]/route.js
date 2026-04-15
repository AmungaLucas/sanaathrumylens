// src/app/api/posts/by-author/[slug]/route.js
// GET: Fetch posts by author slug
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
      return successResponse({ posts: [], author: null });
    }
    const { slug } = await params;

    if (!slug) {
      return errorResponse('Author slug is required', 400);
    }

    // Find the author by slug
    const authorRows = await query(
      'SELECT id, name, slug, bio, avatar FROM authors WHERE slug = ? LIMIT 1',
      [slug]
    );

    let authorId = null;
    let authorData = null;

    if (Array.isArray(authorRows) && authorRows.length > 0) {
      authorId = authorRows[0].id;
      authorData = {
        id: authorRows[0].id,
        name: authorRows[0].name,
        slug: authorRows[0].slug,
        bio: authorRows[0].bio,
        avatar: authorRows[0].avatar,
      };
    }

    if (!authorId) {
      return successResponse({ posts: [], author: null });
    }

    // Fetch published posts by this author
    const rows = await query(
      `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
       FROM posts p
       LEFT JOIN authors a ON p.author_id = a.id
       WHERE p.author_id = ? AND p.status = 'published' AND p.is_deleted = 0
       ORDER BY p.published_at DESC`,
      [authorId]
    );

    const posts = Array.isArray(rows)
      ? rows.map(formatPost)
      : [];

    return successResponse({ posts, author: authorData });
  } catch (err) {
    console.error('Error fetching posts by author:', err);
    return errorResponse('Failed to fetch posts by author', 500);
  }
}
