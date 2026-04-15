// src/app/api/authors/[slug]/route.js
// GET: Fetch a single author with their posts
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
      return errorResponse('Author not found', 404);
    }
    const { slug } = await params;

    if (!slug) {
      return errorResponse('Author slug is required', 400);
    }

    // Fetch author by slug
    const authorRows = await query(
      'SELECT * FROM authors WHERE slug = ? LIMIT 1',
      [slug]
    );

    if (!Array.isArray(authorRows) || authorRows.length === 0) {
      // Try looking up in users table as fallback
      const userRows = await query(
        'SELECT * FROM users WHERE slug = ? AND is_public = 1 LIMIT 1',
        [slug]
      );
      if (!Array.isArray(userRows) || userRows.length === 0) {
        return errorResponse('Author not found', 404);
      }
    }

    const author = authorRows?.[0] || null;
    const userAuthor = (!author) ? (await query(
      'SELECT * FROM users WHERE slug = ? AND is_public = 1 LIMIT 1',
      [slug]
    ))?.[0] : null;

    const authorData = author || userAuthor;
    if (!authorData) {
      return errorResponse('Author not found', 404);
    }

    const authorId = author ? author.id : null;

    // Fetch author's published posts
    let posts = [];
    if (authorId) {
      const postRows = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
         FROM posts p
         LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.author_id = ? AND p.status = 'published' AND p.is_deleted = 0
         ORDER BY p.published_at DESC`,
        [authorId]
      );
      posts = Array.isArray(postRows) ? postRows.map(formatPost) : [];
    }

    return successResponse({
      author: {
        id: authorData.id,
        slug: authorData.slug,
        name: authorData.name || authorData.display_name || slug,
        bio: authorData.bio || null,
        avatar: authorData.avatar || null,
      },
      posts,
    });
  } catch (err) {
    console.error('Error fetching author:', err);
    return errorResponse('Failed to fetch author', 500);
  }
}
