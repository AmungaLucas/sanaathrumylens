import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION, TWITTER_HANDLE } from './../../seo/constants';
import { query, initDatabase } from '@/lib/db';
import { formatEvent } from '@/lib/apiHelper';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, Flame } from 'lucide-react';
import EventsFilterBar from './_components/EventsFilterBar';
import EventsCalendar from './_components/EventsCalendar';
import AdsGoogle from '@/components/AdsGoogle';

// ISR: Revalidate page every 60 seconds
export const revalidate = 60;

async function ensureDb() {
    return await initDatabase();
}

function formatDate(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function daysFromNow(date) {
    const now = new Date();
    const d = date instanceof Date ? date : new Date(date);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function getEventStatus(startDate, endDate) {
    if (!startDate) return { label: 'Date TBD', color: 'bg-[#F5F1EB] text-[#6B5E55]' };

    const now = new Date();
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;

    if (now < start) {
        const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7) return { label: 'Starting Soon', color: 'bg-blue-100 text-blue-800' };
        return { label: 'Upcoming', color: 'bg-[#F5F1EB] text-[#4A342E]' };
    } else if (end && now <= end) {
        return { label: 'Ongoing', color: 'bg-[#F0E8D9] text-[#8B6F47]' };
    } else {
        return { label: 'Past', color: 'bg-[#F5F1EB] text-[#6B5E55]' };
    }
}

async function fetchEventsWithFilters(search = '', category = '', type = 'all', showPast = false, page = 1, limit = 12) {
    try {
        await ensureDb();

        const conditions = ["e.status = 'published'", 'e.is_deleted = 0'];
        const values = [];

        if (search) {
            conditions.push('(e.title LIKE ? OR e.description LIKE ? OR e.excerpt LIKE ?)');
            const term = `%${search}%`;
            values.push(term, term, term);
        }

        // Type filter
        if (type === 'online') {
            conditions.push('e.is_online = 1');
        } else if (type === 'in-person') {
            conditions.push('e.is_online = 0');
        }

        // Past events filter
        if (!showPast) {
            conditions.push('e.start_date >= CURRENT_TIMESTAMP');
        }

        const where = conditions.join(' AND ');

        // Count total
        const countRows = await query(`SELECT COUNT(*) as total FROM events e WHERE ${where}`, values);
        const totalEvents = Array.isArray(countRows) && countRows[0] ? countRows[0].total : 0;

        // Fetch paginated events
        const offset = (page - 1) * limit;
        const eventRows = await query(
            `SELECT * FROM events e WHERE ${where} ORDER BY e.start_date ASC LIMIT ? OFFSET ?`,
            [...values, limit, offset]
        );

        const events = Array.isArray(eventRows) ? eventRows.map(formatEvent) : [];

        return {
            events,
            totalEvents,
            currentPage: page,
            totalPages: Math.ceil(totalEvents / limit),
            hasMore: totalEvents > offset + limit
        };
    } catch (error) {
        console.error('Error fetching events:', error);
        return { events: [], totalEvents: 0, currentPage: 1, totalPages: 1, hasMore: false };
    }
}

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.q || '';

    return {
        title: `${search ? `Events: "${search}"` : 'Events & Gatherings'} - ${SITE_NAME}`,
        description: 'Discover workshops, meetups, concerts, and creative gatherings in Kenya. Find and join amazing events happening near you.',
        alternates: {
            canonical: `${SITE_URL}/events`,
        },
        openGraph: {
            type: 'website',
            title: `Events & Gatherings - ${SITE_NAME}`,
            description: 'Discover workshops, meetups, concerts, and creative gatherings in Kenya.',
            url: `${SITE_URL}/events`,
            siteName: SITE_NAME,
            images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Events & Gatherings' }],
        },
    };
}

export default async function EventsPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.q || '';
    const category = params.category || 'all';
    const type = params.type || 'all';

    // Fetch events with filters
    const { events, totalEvents, totalPages, hasMore } = await fetchEventsWithFilters(
        search, category, type, false, page, 12
    );

    // Also fetch ALL upcoming events for calendar (limit to reasonable amount)
    const allEventsData = await fetchEventsWithFilters('', '', 'all', false, 1, 100);
    const calendarEvents = allEventsData.events;

    // Find featured and "happening soon" events
    const happeningSoon = events.filter(e => {
        const days = daysFromNow(e.startDate);
        return days >= 0 && days <= 7;
    });

    const featuredEvent = events.find(e => e.isFeatured);
    const otherEvents = events.filter(e => !e.isFeatured || e.id !== featuredEvent?.id);

    // Structured data for events listing
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': events.slice(0, 10).map((event, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'item': {
                '@type': 'Event',
                'name': event.title,
                'description': event.description || event.excerpt,
                'startDate': event.startDate,
                'endDate': event.endDate,
                'eventAttendanceMode': event.isOnline ?
                    'https://schema.org/OnlineEventAttendanceMode' :
                    'https://schema.org/OfflineEventAttendanceMode',
                'location': event.isOnline ? {
                    '@type': 'VirtualLocation',
                    'url': `${SITE_URL}/events/${event.slug || event.id}`
                } : {
                    '@type': 'Place',
                    'name': typeof event.location === 'string' ? event.location : (event.location?.venue || 'Location TBD'),
                    'address': { '@type': 'PostalAddress', 'addressCountry': 'KE' }
                },
                'image': event.coverImage,
                'url': `${SITE_URL}/events/${event.slug || event.id}`,
            }
        }))
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB]">
            {/* Structured data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            {/* Hero */}
            <section className="bg-linear-to-t from-[#F5F1EB] via-[#E7DDD1] to-[#D6C4AE] py-12 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-[#4A342E]">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            Discover Amazing Events
                        </h1>
                        <p className="text-[#6B5E55] mb-8 md:mb-10 text-sm md:text-base">
                            Workshops, meetups, concerts & creative gatherings in Kenya
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Body */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content - 3 columns */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Search and Filter (wrapped in Suspense for useSearchParams) */}
                        <Suspense fallback={
                            <div className="bg-white p-6 rounded-lg shadow animate-pulse">
                                <div className="h-10 bg-[#F5F1EB] rounded-lg"></div>
                            </div>
                        }>
                            <EventsFilterBar
                                initialSearch={search}
                                initialCategory={category}
                                initialType={type}
                            />
                        </Suspense>

                        {/* Results count */}
                        <div className="text-sm text-[#6B5E55]">
                            {search || category !== 'all' || type !== 'all' ? (
                                `Showing ${events.length} of ${totalEvents} event${totalEvents !== 1 ? 's' : ''}`
                            ) : (
                                `${totalEvents} event${totalEvents !== 1 ? 's' : ''} found`
                            )}
                        </div>

                        {/* Featured Event */}
                        {featuredEvent && (
                            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                <Link href={`/events/${featuredEvent.slug || featuredEvent.id}`} className="block">
                                    <div className="md:flex">
                                        <div className="md:w-1/2 relative aspect-video md:aspect-auto">
                                            {featuredEvent.coverImage ? (
                                                <Image
                                                    src={featuredEvent.coverImage}
                                                    alt={`${featuredEvent.title} — Event image`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    priority
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-[#6B8E23] text-white text-sm px-3 py-1 rounded-full font-medium">
                                                    Featured Event
                                                </span>
                                            </div>
                                        </div>
                                        <div className="md:w-1/2 p-6 md:p-8">
                                            <div className="mb-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEventStatus(featuredEvent.startDate, featuredEvent.endDate).color}`}>
                                                    {getEventStatus(featuredEvent.startDate, featuredEvent.endDate).label}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-bold mb-4 text-[#4A342E] hover:text-[#6B8E23] transition-colors">
                                                {featuredEvent.title}
                                            </h2>
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-2 text-[#6B5E55]">
                                                    <Calendar size={18} />
                                                    <span className="text-sm">{formatDate(featuredEvent.startDate)}</span>
                                                    {featuredEvent.endDate && (
                                                        <><span className="text-sm">to</span><span className="text-sm">{formatDate(featuredEvent.endDate)}</span></>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[#6B5E55]">
                                                    <MapPin size={18} />
                                                    <span className="text-sm">
                                                        {featuredEvent.isOnline ? 'Online Event' :
                                                            (typeof featuredEvent.location === 'string' ? featuredEvent.location : (featuredEvent.location?.city || 'Location TBD'))}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[#6B5E55]">
                                                    <Clock size={18} />
                                                    <span className="text-sm">{formatTime(featuredEvent.startDate)}</span>
                                                </div>
                                            </div>
                                            <p className="text-[#6B5E55] mb-6 line-clamp-3">
                                                {featuredEvent.description || featuredEvent.excerpt}
                                            </p>
                                            <span className="text-[#6B8E23] font-medium flex items-center gap-2">
                                                View Details
                                                <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Happening This Week */}
                        {happeningSoon.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#4A342E]">
                                    <div className="w-2 h-6 bg-[#6B8E23] rounded"></div>
                                    Happening This Week
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {happeningSoon.slice(0, 4).map((event) => {
                                        const status = getEventStatus(event.startDate, event.endDate);
                                        return (
                                            <Link
                                                key={event.id}
                                                href={`/events/${event.slug || event.id}`}
                                                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                            >
                                                <div className="relative aspect-video">
                                                    {event.coverImage ? (
                                                        <Image
                                                            src={event.coverImage}
                                                            alt={`${event.title} — Event image`}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                                    )}
                                                    <div className="absolute top-3 left-3 flex gap-2">
                                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                        {event.isOnline && (
                                                            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                                                Online
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-[#4A342E] mb-2 hover:text-[#6B8E23] transition-colors line-clamp-2">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-xs text-[#6B5E55]">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {formatDate(event.startDate)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {event.isOnline ? 'Online' : (typeof event.location === 'string' ? event.location : (event.location?.city || 'TBD'))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* All Events Grid */}
                        {otherEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {otherEvents.map((event) => {
                                    const status = getEventStatus(event.startDate, event.endDate);
                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.slug || event.id}`}
                                            className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                            <div className="relative aspect-video">
                                                {event.coverImage ? (
                                                    <Image
                                                        src={event.coverImage}
                                                        alt={`${event.title} — Event image`}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                                )}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    {event.isOnline && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                                            Online
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-[#4A342E] mb-2 hover:text-[#6B8E23] transition-colors line-clamp-2">
                                                    {event.title}
                                                </h3>
                                                <p className="text-sm text-[#6B5E55] mb-3 line-clamp-2">
                                                    {event.description || event.excerpt}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-[#6B5E55]">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(event.startDate)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {event.isOnline ? 'Online' : (typeof event.location === 'string' ? event.location : (event.location?.city || 'TBD'))}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : !featuredEvent && happeningSoon.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow">
                                <div className="text-[#6B5E55] text-5xl mb-4">🎪</div>
                                <h3 className="text-xl font-bold mb-2 text-[#4A342E]">No events found</h3>
                                <p className="text-[#6B5E55] mb-4">Try adjusting your search or check back soon for new events</p>
                                <Link
                                    href="/events"
                                    className="text-[#6B8E23] hover:text-[#5A7D1B] font-medium"
                                >
                                    Clear filters
                                </Link>
                            </div>
                        ) : null}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Events Pagination">
                                {page > 1 && (
                                    <Link
                                        href={page === 2 ? '/events' : `/events?page=${page - 1}${search ? `&q=${search}` : ''}${type !== 'all' ? `&type=${type}` : ''}`}
                                        className="px-4 py-2 rounded-lg border border-[#F5F1EB] hover:bg-[#F5F1EB] text-sm font-medium text-[#4A342E] transition-colors"
                                    >
                                        ← Previous
                                    </Link>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) {
                                            acc.push(<span key={`ellipsis-${p}`} className="px-2 text-[#6B5E55]">...</span>);
                                        }
                                        acc.push(
                                            <Link
                                                key={p}
                                                href={p === 1 ? `/events${search ? `?q=${search}` : ''}${type !== 'all' ? `${search ? '&' : '?'}type=${type}` : ''}` : `/events?page=${p}${search ? `&q=${search}` : ''}${type !== 'all' ? `&type=${type}` : ''}`}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${p === page
                                                    ? 'bg-[#6B8E23] text-white'
                                                    : 'border border-[#F5F1EB] hover:bg-[#F5F1EB] text-[#4A342E]'
                                                    }`}
                                            >
                                                {p}
                                            </Link>
                                        );
                                        return acc;
                                    }, [])}

                                {hasMore && page < totalPages && (
                                    <Link
                                        href={`/events?page=${page + 1}${search ? `&q=${search}` : ''}${type !== 'all' ? `&type=${type}` : ''}`}
                                        className="px-4 py-2 rounded-lg border border-[#F5F1EB] hover:bg-[#F5F1EB] text-sm font-medium text-[#4A342E] transition-colors"
                                    >
                                        Next →
                                    </Link>
                                )}
                            </nav>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Calendar */}
                        <EventsCalendar events={calendarEvents} />

                        {/* Google Ads */}
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 min-h-60">
                            <AdsGoogle slot="7129674925" style={{ display: 'block', width: '100%', height: '100%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
