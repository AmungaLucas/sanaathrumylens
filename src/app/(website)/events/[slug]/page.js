// src/app/events/[slug]/page.js
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../../../seo/constants';
import { generateEventMetadata } from '@/app/seo/meta';
import { query, initDatabase } from '@/lib/db';
import { formatEvent } from '@/lib/apiHelper';
import EventClientPage from './EventClientPage';

async function ensureDb() {
    return await initDatabase();
}

export async function generateMetadata({ params }) {
    const { slug } = await params;

    const dbOk = await ensureDb();
    if (!dbOk) {
        return {
            title: SITE_NAME,
            description: 'Service temporarily unavailable.',
        };
    }

    const event = await fetchEventBySlug(slug);

    if (!event) {
        return {
            title: 'Event Not Found',
            description: 'The event you are looking for does not exist.',
        };
    }

    return generateEventMetadata(event);
}

// Fetch event by slug from DB
async function fetchEventBySlug(slug) {
    try {
        const dbOk = await ensureDb();
        if (!dbOk) return null;
        const rows = await query(
            `SELECT * FROM events WHERE slug = ? AND status = 'published' AND is_deleted = 0 LIMIT 1`,
            [slug]
        );

        if (!Array.isArray(rows) || rows.length === 0) return null;
        return formatEvent(rows[0]);
    } catch (error) {
        console.error('Error fetching event for SEO:', error);
        return null;
    }
}

export default async function EventPage({ params }) {
    const { slug } = await params;

    const dbOk = await ensureDb();
    if (!dbOk) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#f5f1e8]">
                <div className="text-center">
                    <p className="text-gray-500">Service temporarily unavailable. Please try again later.</p>
                </div>
            </div>
        );
    }

    // Fetch full event data for initial render
    const initialEvent = await fetchEventBySlug(slug);

    return <EventClientPage
        initialEvent={initialEvent}
        slug={slug}
        siteUrl={SITE_URL}
        siteName={SITE_NAME}
    />;
}
