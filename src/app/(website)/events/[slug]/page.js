// src/app/events/[slug]/page.js
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../../../seo/constants';
import { generateEventMetadata } from '@/app/seo/meta';
import { query, initDatabase } from '@/lib/db';
import { formatEvent } from '@/lib/apiHelper';
import EventClientPage from './EventClientPage';

let dbReady = false;
async function ensureDb() {
    if (!dbReady) {
        await initDatabase();
        dbReady = true;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
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
        await ensureDb();
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

    // Fetch full event data for initial render
    const initialEvent = await fetchEventBySlug(slug);

    return <EventClientPage
        initialEvent={initialEvent}
        slug={slug}
        siteUrl={SITE_URL}
        siteName={SITE_NAME}
    />;
}
