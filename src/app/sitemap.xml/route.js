import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { SITE_URL } from '../seo/constants';

const MAX_URLS_PER_SITEMAP = 50000;

// In-memory cache for performance
let sitemapCache = {
    xml: null,
    timestamp: 0,
    ttl: 1000 * 60 * 10, // 10 minutes
};

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

// Helper: ensure valid URLs
const sanitizeUrl = (url) => {
    if (!url) return null;
    try {
        return encodeURI(url);
    } catch {
        return null;
    }
};

// Determine changefreq and priority based on date
const heuristicsForDate = (isoDate) => {
    if (!isoDate) return { changefreq: 'monthly', priority: 0.6 };
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return { changefreq: 'monthly', priority: 0.6 };

    const ageDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) return { changefreq: 'daily', priority: 0.9 };
    if (ageDays <= 30) return { changefreq: 'weekly', priority: 0.8 };
    return { changefreq: 'monthly', priority: 0.6 };
};

// Generate XML entry for a URL
const generateUrlEntry = (loc, lastmod = null, changefreq = 'weekly', priority = 0.7, images = []) => {
    const imgBlock = images
        .map((img) => `\n    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`)
        .join('');
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${imgBlock}\n  </url>`;
};

// Build sitemap XML
const buildSitemapXml = (urlEntries) => {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urlEntries.join(
        '\n'
    )}\n</urlset>`;
};

function toISO(date) {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET() {
    try {
        // Return cached sitemap if valid
        if (sitemapCache.xml && Date.now() - sitemapCache.timestamp < sitemapCache.ttl) {
            return new NextResponse(sitemapCache.xml, { headers: { 'Content-Type': 'application/xml' } });
        }

        await ensureDb();

        // Fetch published posts from DB
        const postRows = await query(
            "SELECT slug, cover_image, featured_image, published_at, updated_at FROM posts WHERE status = 'published' AND is_deleted = 0 ORDER BY published_at DESC LIMIT 50000"
        );
        const posts = Array.isArray(postRows) ? postRows : [];

        // Fetch published events from DB
        const eventRows = await query(
            "SELECT slug, cover_image, featured_image, start_date, updated_at FROM events WHERE status = 'published' AND is_deleted = 0 ORDER BY start_date ASC LIMIT 50000"
        );
        const events = Array.isArray(eventRows) ? eventRows : [];

        // Dynamic URLs for posts
        const dynamicUrls = posts
            .map((post) => {
                if (!post.slug) return null;

                const loc = sanitizeUrl(`${SITE_URL}/blogs/${post.slug}`);
                if (!loc) return null;

                const lastmodISO = toISO(post.updated_at || post.published_at);
                const lastmod = lastmodISO || new Date().toISOString();

                const { changefreq, priority } = heuristicsForDate(lastmodISO);

                // Support optional images
                const images = [
                    post.cover_image,
                    post.featured_image
                ].filter(img => typeof img === 'string');

                return generateUrlEntry(loc, lastmod, changefreq, priority, images);
            })
            .filter(Boolean);

        // Dynamic URLs for events
        const eventUrls = events
            .map((event) => {
                if (!event.slug) return null;

                const loc = sanitizeUrl(`${SITE_URL}/events/${event.slug}`);
                if (!loc) return null;

                const lastmodISO = toISO(event.updated_at || event.start_date);
                const lastmod = lastmodISO || new Date().toISOString();

                const { changefreq, priority } = heuristicsForDate(lastmodISO);

                // Support optional images for events
                const images = [
                    event.cover_image,
                    event.featured_image
                ].filter(img => typeof img === 'string');

                return generateUrlEntry(loc, lastmod, changefreq, 0.8, images);
            })
            .filter(Boolean);

        // Static URLs
        const staticPages = [
            '/',
            '/blogs',
            '/events',
            '/about',
            '/author',
            '/categories',
            '/tags'
        ];

        const staticUrls = staticPages
            .map((path) => {
                const loc = sanitizeUrl(`${SITE_URL}${path}`);
                if (!loc) return null;

                // Set priority for important pages
                let priority = 0.8;
                if (path === '/') priority = 1.0;
                if (path === '/events') priority = 0.9;
                if (path === '/blogs') priority = 0.9;

                return generateUrlEntry(loc, null, 'weekly', priority);
            })
            .filter(Boolean);

        // Combine all URLs
        const allUrls = [...staticUrls, ...dynamicUrls, ...eventUrls];

        // Handle sitemap splitting if needed
        const sitemapXml = buildSitemapXml(allUrls.slice(0, MAX_URLS_PER_SITEMAP));

        // Cache
        sitemapCache.xml = sitemapXml;
        sitemapCache.timestamp = Date.now();

        return new NextResponse(sitemapXml, { headers: { 'Content-Type': 'application/xml' } });
    } catch (err) {
        console.error('Sitemap generation error:', err);

        // If everything fails, return at least a basic valid sitemap
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL || 'https://yoursite.com'}</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;

        return new NextResponse(fallbackXml, {
            headers: { 'Content-Type': 'application/xml' },
            status: 200 // Still return 200 even on error to avoid SEO issues
        });
    }
}
