// src/app/og/[slug]/route.js
import { ImageResponse } from '@vercel/og';
import { query, initDatabase } from '@/lib/db';

export const runtime = 'nodejs';

let dbReady = false;
async function ensureDb() {
    if (!dbReady) {
        await initDatabase();
        dbReady = true;
    }
}

function safeJsonParse(str) {
    if (!str) return null;
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch { return null; }
}

const FONT_SIZE = 56;

export default async function handler(req, { params }) {
    try {
        const { slug } = params;

        await ensureDb();
        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.slug = ? AND p.status = 'published' AND p.is_deleted = 0
             LIMIT 1`,
            [slug]
        );

        const post = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        const title = post?.title || 'Sanaathrumylens';
        const authorSnapshot = safeJsonParse(post?.author_snapshot);
        const author = post?.author_name || authorSnapshot?.name || process.env.SITE_NAME || 'Sanaathrumylens';
        const bg = post?.cover_image || post?.featured_image || null;

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#111827',
                        color: 'white',
                        fontFamily: 'Inter, system-ui, Arial, sans-serif',
                        position: 'relative',
                    }}
                >
                    {bg && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `url(${bg})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.45)',
                            }}
                        />
                    )}
                    <div
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: 48,
                            width: '100%',
                        }}
                    >
                        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>{author}</div>
                        <div
                            style={{
                                fontSize: FONT_SIZE,
                                lineHeight: 1.05,
                                fontWeight: 700,
                                maxWidth: '90%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {title}
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (err) {
        console.error('OG image generation error:', err);

        return new ImageResponse(
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#111827',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, Arial, sans-serif',
                }}
            >
                <div style={{ fontSize: 36 }}>Sanaathrumylens</div>
            </div>,
            { width: 1200, height: 630 }
        );
    }
}
