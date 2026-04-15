// src/app/og/events/[slug]/route.js

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

export default async function handler(req, { params }) {
    try {
        const { slug } = params;

        await ensureDb();
        const rows = await query(
            `SELECT * FROM events WHERE slug = ? AND status = 'published' AND is_deleted = 0 LIMIT 1`,
            [slug]
        );

        const event = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        const title = event?.title || 'Event';
        const date = event?.start_date ? new Date(event.start_date).toLocaleDateString() : '';
        const bg = event?.cover_image || event?.featured_image || null;

        return new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, Arial, sans-serif',
                }}>
                    {bg && <img src={bg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }} />}
                    <div style={{ position: 'relative', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
                        <div style={{ fontSize: 20, opacity: 0.9 }}>{date}</div>
                        <div style={{ fontSize: 56, lineHeight: 1.02, fontWeight: 700, marginTop: 8 }}>{title}</div>
                    </div>
                </div>
            ),
            { width: 1200, height: 630 }
        );
    } catch (err) {
        console.error('OG event image error', err);
        return new ImageResponse((
            <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: 'white' }}>
                <div style={{ fontSize: 36 }}>Event</div>
            </div>
        ), { width: 1200, height: 630 });
    }
}
