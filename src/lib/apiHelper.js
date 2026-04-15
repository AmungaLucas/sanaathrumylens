// src/lib/apiHelper.js
// SQL and API response helpers
import { NextResponse } from 'next/server';
import { getDbType } from './db';

/**
 * Parse a JSON string field safely
 */
function safeJsonParse(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Convert a date value to ISO string
 */
function toISO(date) {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert snake_case DB row keys to camelCase
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Convert entire object's keys from snake_case to camelCase
 */
function keysToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), keysToCamel(v)])
    );
  }
  return obj;
}

/**
 * Format a post row for API response
 */
export function formatPost(post) {
  if (!post) return null;

  const authorSnapshot = safeJsonParse(post.author_snapshot);
  const categoryIds = safeJsonParse(post.category_ids);
  const tags = safeJsonParse(post.tags);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.cover_image,
    featuredImage: post.featured_image,
    author: post.author_id ? {
      id: post.author_id,
      name: post.author_name || authorSnapshot?.name || null,
      slug: post.author_slug || authorSnapshot?.slug || null,
      avatar: post.author_avatar || authorSnapshot?.avatar || null,
      bio: post.author_bio || null,
    } : (authorSnapshot || null),
    authorSnapshot: authorSnapshot || undefined,
    categoryIds: categoryIds || [],
    tags: tags || [],
    status: post.status,
    isFeatured: Boolean(post.is_featured),
    isDeleted: Boolean(post.is_deleted),
    readingTime: post.reading_time || 5,
    publishedAt: toISO(post.published_at),
    createdAt: toISO(post.created_at),
    updatedAt: toISO(post.updated_at),
    stats: {
      views: post.stats_views || 0,
      likes: post.stats_likes || 0,
      comments: post.stats_comments || 0,
    },
  };
}

/**
 * Format a comment row for API response
 */
export function formatComment(comment, likedByUser = false) {
  if (!comment) return null;
  return {
    id: comment.id,
    postId: comment.post_id,
    userId: comment.user_id,
    userName: comment.user_name,
    userAvatar: comment.user_avatar,
    content: comment.content,
    parentId: comment.parent_id,
    status: comment.status,
    likes: comment.likes || 0,
    likedByUser: Boolean(likedByUser),
    isEdited: Boolean(comment.is_edited),
    isDeleted: Boolean(comment.is_deleted),
    createdAt: toISO(comment.created_at),
    updatedAt: toISO(comment.updated_at),
  };
}

/**
 * Format an event row for API response
 */
export function formatEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    excerpt: event.excerpt,
    description: event.description,
    coverImage: event.cover_image,
    featuredImage: event.featured_image,
    location: event.location,
    isOnline: Boolean(event.is_online),
    status: event.status,
    isDeleted: Boolean(event.is_deleted),
    startDate: toISO(event.start_date),
    endDate: toISO(event.end_date),
    createdAt: toISO(event.created_at),
    updatedAt: toISO(event.updated_at),
  };
}

/**
 * Build a post query with dynamic WHERE clauses
 * @param {string} baseSelect - The base SELECT ... FROM ... JOIN
 * @param {object} params - Query params from request
 * @returns {{ sql: string, values: array }}
 */
export function buildPostQuery(baseSelect, params) {
  const conditions = [];
  const values = [];
  const { search, category, tag, status = 'published', isDeleted = false, featured } = params;

  // Always filter by status
  if (status) {
    conditions.push('p.status = ?');
    values.push(status);
  }

  // Filter out deleted
  if (!isDeleted) {
    conditions.push('p.is_deleted = 0');
  }

  // Search by title
  if (search && search.trim()) {
    conditions.push('(p.title LIKE ? OR p.excerpt LIKE ?)');
    const term = `%${search.trim()}%`;
    values.push(term, term);
  }

  // Filter by category
  if (category) {
    // For JSON text fields, we do a simple LIKE match
    conditions.push('p.category_ids LIKE ?');
    values.push(`%"${category}"%`);
  }

  // Filter by tag
  if (tag) {
    conditions.push('p.tags LIKE ?');
    values.push(`%"${tag}"%`);
  }

  // Filter featured
  if (featured !== undefined && featured !== '') {
    conditions.push('p.is_featured = ?');
    values.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let order = 'p.published_at DESC';
  if (params.sort) {
    const sortCol = params.sort === 'publishedAt' ? 'p.published_at'
      : params.sort === 'createdAt' ? 'p.created_at'
      : params.sort === 'title' ? 'p.title'
      : params.sort === 'views' ? 'p.stats_views'
      : params.sort === 'likes' ? 'p.stats_likes'
      : 'p.published_at';

    const dir = (params.sortDir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    order = `${sortCol} ${dir}`;
  }

  // Limit
  let limit = '';
  if (params.limit) {
    limit = 'LIMIT ?';
    values.push(parseInt(params.limit, 10));
  }

  // Offset
  let offset = '';
  if (params.page && params.limit) {
    const page = Math.max(1, parseInt(params.page, 10));
    const limitVal = parseInt(params.limit, 10);
    offset = 'OFFSET ?';
    values.push((page - 1) * limitVal);
  }

  const sql = `${baseSelect} ${where} ORDER BY ${order} ${limit} ${offset}`.trim();

  return { sql, values };
}

/**
 * Return a success JSON response
 */
export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Return an error JSON response
 */
export function errorResponse(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Get the count SQL for pagination
 */
export function buildPostCountQuery(params) {
  const conditions = [];
  const values = [];
  const { search, category, tag, status = 'published', featured } = params;

  if (status) {
    conditions.push('p.status = ?');
    values.push(status);
  }

  conditions.push('p.is_deleted = 0');

  if (search && search.trim()) {
    conditions.push('(p.title LIKE ? OR p.excerpt LIKE ?)');
    const term = `%${search.trim()}%`;
    values.push(term, term);
  }

  if (category) {
    conditions.push('p.category_ids LIKE ?');
    values.push(`%"${category}"%`);
  }

  if (tag) {
    conditions.push('p.tags LIKE ?');
    values.push(`%"${tag}"%`);
  }

  if (featured !== undefined && featured !== '') {
    conditions.push('p.is_featured = ?');
    values.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT COUNT(*) as total FROM posts p ${where}`;

  return { sql, values };
}
