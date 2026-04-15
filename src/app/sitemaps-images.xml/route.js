// src/app/sitemaps-images.xml/route.js
import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

import { SITE_URL } from '../seo/constants';

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

export async function GET() {
    try {
        await ensureDb();

        const [postRows, eventRows] = await Promise.all([
            query("SELECT slug, title, cover_image, featured_image FROM posts WHERE status = 'published' AND is_deleted = 0 ORDER BY published_at DESC LIMIT 500"),
            query("SELECT slug, title, cover_image, featured_image FROM events WHERE status = 'published' AND is_deleted = 0 ORDER BY start_date DESC LIMIT 500")
        ]);

        const posts = Array.isArray(postRows) ? postRows : [];
        const events = Array.isArray(eventRows) ? eventRows : [];

        // Process posts
        const postItems = posts
            .filter((post) => post.cover_image || post.featured_image)
            .map((post) => {
                const loc = `${SITE_URL}/blogs/${post.slug}`;
                const title = escapeXml(post.title || '');

                // Collect all images
                const images = [
                    post.cover_image,
                    post.featured_image,
                ].filter(img => typeof img === 'string');

                const imageBlocks = images
                    .map((img) => `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:caption>${title}</image:caption>
      <image:title>${title}</image:title>
    </image:image>`)
                    .join('\n');

                return `  <url>
    <loc>${escapeXml(loc)}</loc>
${imageBlocks}
  </url>`;
            });

        // Process events
        const eventItems = events
            .filter((event) => event.cover_image || event.featured_image)
            .map((event) => {
                const loc = `${SITE_URL}/events/${event.slug || event.id}`;
                const title = escapeXml(event.title || '');

                // Collect all images
                const images = [
                    event.cover_image,
                    event.featured_image,
                ].filter(img => typeof img === 'string');

                const imageBlocks = images
                    .map((img) => `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:caption>${title}</image:caption>
      <image:title>${title}</image:title>
    </image:image>`)
                    .join('\n');

                return `  <url>
    <loc>${escapeXml(loc)}</loc>
${imageBlocks}
  </url>`;
            });

        const allItems = [...postItems, ...eventItems];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allItems.join('\n')}
</urlset>`;

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml' },
        });
    } catch (error) {
        console.error('Error generating image sitemap:', error);
        return new NextResponse(`Error generating image sitemap: ${error.message}`, { status: 500 });
    }
}
