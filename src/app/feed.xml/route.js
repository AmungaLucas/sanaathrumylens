import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { SITE_NAME, SITE_URL } from '../seo/constants';

// In-memory cache
let cachedRSS = null;
let lastGenerated = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

let dbReady = false;
async function ensureDb() {
    if (!dbReady) {
        await initDatabase();
        dbReady = true;
    }
}

// Escape XML special characters
const escapeXml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

function safeJsonParse(str) {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return null; }
}

function toISO(date) {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET() {
  const now = Date.now();

  // Return cached feed if it's still valid
  if (cachedRSS && now - lastGenerated < CACHE_DURATION) {
    return new NextResponse(cachedRSS, { headers: { 'Content-Type': 'application/rss+xml' } });
  }

  try {
    await ensureDb();

    // Fetch latest published posts
    const postRows = await query(
      "SELECT slug, title, excerpt, cover_image, featured_image, published_at, updated_at, tags, category_ids FROM posts WHERE status = 'published' AND is_deleted = 0 ORDER BY published_at DESC LIMIT 1000"
    );

    // Fetch latest published events
    const eventRows = await query(
      "SELECT slug, title, description, excerpt, cover_image, featured_image, start_date, end_date, created_at, location, is_online FROM events WHERE status = 'published' AND is_deleted = 0 ORDER BY start_date DESC LIMIT 100"
    );

    const posts = Array.isArray(postRows) ? postRows : [];
    const events = Array.isArray(eventRows) ? eventRows : [];

    // Combine and sort all content by date
    const allContent = [
      ...posts.map(post => {
        const categoryIds = safeJsonParse(post.category_ids);
        return {
          type: 'post',
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          coverImage: post.cover_image,
          featuredImage: post.featured_image,
          publishedAt: toISO(post.published_at),
          category: Array.isArray(categoryIds) && categoryIds.length > 0 ? categoryIds[0] : null,
        };
      }),
      ...events.map(event => ({
        type: 'event',
        slug: event.slug,
        title: event.title,
        description: event.description || event.excerpt,
        coverImage: event.cover_image,
        featuredImage: event.featured_image,
        startDate: toISO(event.start_date),
        endDate: toISO(event.end_date),
        createdAt: toISO(event.created_at),
        isOnline: Boolean(event.is_online),
        location: event.location,
      }))
    ].filter(item => {
      if (item.type === 'event' && !item.startDate) return false;
      const date = item.type === 'post' ? item.publishedAt : item.startDate;
      if (!date) return false;
      return !isNaN(new Date(date).getTime());
    }).sort((a, b) => {
      const dateA = a.type === 'post' ? new Date(a.publishedAt) : new Date(a.startDate);
      const dateB = b.type === 'post' ? new Date(b.publishedAt) : new Date(b.startDate);
      return dateB - dateA;
    }).slice(0, 50);

    // Map content to RSS <item> format
    const items = allContent.map((item) => {
      const pubDate = item.type === 'post'
        ? (item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString())
        : (item.startDate ? new Date(item.startDate).toUTCString() : new Date().toUTCString());

      const link = item.type === 'post'
        ? `${SITE_URL}/blogs/${item.slug}`
        : `${SITE_URL}/events/${item.slug || item.id}`;

      const description = item.type === 'post'
        ? (item.excerpt || '')
        : (item.description || item.excerpt || `Event happening on ${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'TBD'}`);

      let categoryTag = '';
      if (item.type === 'post' && item.category) {
        categoryTag = `<category>${escapeXml(item.category)}</category>`;
      } else if (item.type === 'event') {
        categoryTag = `<category>Event</category>`;
      }

      // Add image if available
      let imageTag = '';
      const imageUrl = item.coverImage || item.featuredImage;
      if (imageUrl && typeof imageUrl === 'string') {
        imageTag = `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" />`;
      }

      return `
    <item>
      <title><![CDATA[${item.type === 'event' ? '🎟️ ' : ''}${item.title}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${categoryTag}
      ${imageTag}
      <description><![CDATA[${description || ''}]]></description>
    </item>`;
    });

    // Wrap items in RSS feed
    cachedRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} - Latest Content</title>
    <link>${SITE_URL}</link>
    <description>Latest posts and events from ${SITE_NAME}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items.join('\n')}
  </channel>
</rss>`;

    // Update cache timestamp
    lastGenerated = now;

    return new NextResponse(cachedRSS, { headers: { 'Content-Type': 'application/rss+xml' } });
  } catch (err) {
    console.error('Feed generation error:', err);

    // Fallback: Return a minimal RSS feed even on error
    const fallbackRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>Latest content from ${SITE_NAME}</description>
    <language>en-us</language>
  </channel>
</rss>`;

    return new NextResponse(fallbackRSS, {
      headers: { 'Content-Type': 'application/rss+xml' },
      status: 200
    });
  }
}
