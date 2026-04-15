// src/app/events/[slug]/EventClientPage.jsx
"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar, MapPin, Clock, Users, Ticket, Share2,
    ArrowLeft, Phone, Mail, Globe, Facebook, Twitter,
    Linkedin, ChevronRight
} from 'lucide-react';

// Helper to parse serialized dates
function parseEventDates(event) {
    if (!event) return null;

    const parsed = { ...event };

    // Parse date strings back to Date objects
    if (event.startDate) {
        parsed.startDate = new Date(event.startDate);
    }

    if (event.endDate) {
        parsed.endDate = new Date(event.endDate);
    }

    if (event.registration?.deadline) {
        parsed.registration = {
            ...event.registration,
            deadline: new Date(event.registration.deadline),
        };
    }

    // Parse location if it's a JSON string
    if (typeof event.location === 'string') {
        try { parsed.location = JSON.parse(event.location); } catch { parsed.location = null; }
    }

    // Parse tags if it's a JSON string
    if (typeof event.tags === 'string') {
        try { parsed.tags = JSON.parse(event.tags); } catch { parsed.tags = []; }
    }

    return parsed;
}

export default function EventClientPage({
    initialEvent = null,
    slug,
    siteUrl = 'https://example.com',
    siteName = 'Event Platform'
}) {
    // Parse the initial event data to convert ISO strings back to Date objects
    const [event, setEvent] = useState(() => parseEventDates(initialEvent));
    const [similarEvents, setSimilarEvents] = useState([]);
    const [loading, setLoading] = useState(!initialEvent);
    const [error, setError] = useState(null);
    const [registering, setRegistering] = useState(false);

    const fetchSimilarEvents = useCallback(async (category) => {
        if (!category) return;

        try {
            const res = await fetch(`/api/events?upcoming=false&limit=100`);
            const json = await res.json();

            if (!json.success) return;

            const events = (json.data.events || [])
                .map((e) => ({
                    ...e,
                    startDate: e.startDate ? new Date(e.startDate) : null,
                    location: typeof e.location === 'string' ? (() => { try { return JSON.parse(e.location); } catch { return null; } })() : e.location,
                }))
                .filter(e => e.id !== event?.id)
                .slice(0, 3);

            setSimilarEvents(events);
        } catch (err) {
            console.error('Error fetching similar events:', err);
        }
    }, [event?.id]);

    const fetchEvent = useCallback(async () => {
        if (initialEvent) return; // Already have data from server

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/events/${slug}`);
            const json = await res.json();

            if (!json.success) {
                throw new Error('Event not found');
            }

            const parsed = parseEventDates(json.data);
            setEvent(parsed);
            await fetchSimilarEvents(parsed?.category);
        } catch (err) {
            console.error('Error fetching event:', err);
            setError('Event not found or failed to load');
        } finally {
            setLoading(false);
        }
    }, [slug, initialEvent, fetchSimilarEvents]);

    useEffect(() => {
        if (!initialEvent && slug) {
            fetchEvent();
        }
    }, [slug, initialEvent, fetchEvent]);

    // Initial fetch of similar events if we have event data
    useEffect(() => {
        if (event?.category) {
            fetchSimilarEvents(event.category);
        }
    }, [event?.category, fetchSimilarEvents]);

    const handleRegister = async () => {
        setRegistering(true);
        // In a real app, you'd:
        // 1. Check if user is logged in
        // 2. Create a registration document
        // 3. Send confirmation email
        // 4. Update event stats

        setTimeout(() => {
            setRegistering(false);
            alert('Registration successful! Check your email for confirmation.');
        }, 1500);
    };

    const formatDate = (date) => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Date TBD';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'Time TBD';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateTimeRange = (startDate, endDate) => {
        const start = startDate && startDate instanceof Date ? startDate : null;
        const end = endDate && endDate instanceof Date ? endDate : null;

        if (!start) return 'Date & Time TBD';

        if (!end || start.toDateString() === end.toDateString()) {
            return `${formatDate(start)} • ${formatTime(start)}`;
        }

        return `${formatDate(start)} • ${formatTime(start)} - ${formatDate(end)} • ${formatTime(end)}`;
    };

    const getEventStatus = (startDate, endDate) => {
        if (!startDate || !(startDate instanceof Date)) {
            return { label: 'Date TBD', color: 'bg-[#F5F1EB] text-[#6B5E55]' };
        }

        const now = new Date();
        const start = startDate;
        const end = endDate && endDate instanceof Date ? endDate : null;

        if (now < start) {
            const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
            if (daysUntil === 0) return { label: 'Today', color: 'bg-blue-100 text-blue-800' };
            if (daysUntil <= 7) return { label: 'This Week', color: 'bg-blue-100 text-blue-800' };
            return { label: 'Upcoming', color: 'bg-[#F5F1EB] text-[#4A342E]' };
        } else if (end && now <= end) {
            return { label: 'Happening Now', color: 'bg-[#F0E8D9] text-[#8B6F47]' };
        } else {
            return { label: 'Past Event', color: 'bg-[#F5F1EB] text-[#6B5E55]' };
        }
    };

    const shareEvent = (platform) => {
        const url = window.location.href;
        const title = event?.title || '';
        const text = event?.excerpt || '';

        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            alert('Event link copied to clipboard!');
            return;
        }

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1EB] py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-[#F5F1EB] border-t-[#6B8E23] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[#6B5E55]">Loading event details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
                    <div className="text-red-500 text-5xl mb-4">🎪</div>
                    <h2 className="text-2xl font-bold mb-2 text-[#4A342E]">Event Not Found</h2>
                    <p className="text-[#6B5E55] mb-6">The event you&apos;re looking for doesn&apos;t exist or has been cancelled.</p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/events"
                            className="bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5A7D1B] transition-colors font-medium"
                        >
                            ← Browse All Events
                        </Link>
                        <Link
                            href="/"
                            className="text-[#6B5E55] hover:text-[#4A342E]"
                        >
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const eventStatus = getEventStatus(event.startDate, event.endDate);

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Event',
                        name: event.title,
                        description: event.description || event.excerpt,
                        image: event.coverImage,
                        startDate: event.startDate ? event.startDate.toISOString() : undefined,
                        endDate: event.endDate ? event.endDate.toISOString() : undefined,
                        eventAttendanceMode: event.isOnline ?
                            'https://schema.org/OnlineEventAttendanceMode' :
                            'https://schema.org/OfflineEventAttendanceMode',
                        location: event.isOnline ? {
                            '@type': 'VirtualLocation',
                            'url': event.onlineUrl || `${siteUrl}/events/${event.slug || event.id}`
                        } : {
                            '@type': 'Place',
                            'name': event.location?.venue || 'Location TBD',
                            'address': {
                                '@type': 'PostalAddress',
                                'addressLocality': event.location?.city,
                                'addressCountry': event.location?.country || 'KE'
                            }
                        },
                        url: `${siteUrl}/events/${event.slug || event.id}`,
                        offers: {
                            '@type': 'Offer',
                            'price': event.registration?.fee || 0,
                            'priceCurrency': 'KES',
                            'availability': 'https://schema.org/InStock',
                            'validFrom': new Date().toISOString()
                        },
                        organizer: {
                            '@type': 'Organization',
                            'name': siteName,
                            'url': siteUrl
                        }
                    })
                }}
            />

            <div className="min-h-screen bg-[#F5F1EB]">
                {/* Back Navigation */}
                <div className="bg-white border-b border-[#F5F1EB]">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 text-[#6B5E55] hover:text-[#4A342E] font-medium"
                        >
                            <ArrowLeft size={16} />
                            Back to Events
                        </Link>
                    </div>
                </div>

                {/* Event Header */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {/* Event Status & Category */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${eventStatus.color}`}>
                                    {eventStatus.label}
                                </span>
                                {event.category && (
                                    <span className="bg-[#F5F1EB] text-[#4A342E] px-3 py-1 rounded-full text-sm font-medium">
                                        {event.category}
                                    </span>
                                )}
                                {event.featured && (
                                    <span className="bg-[#F0E8D9] text-[#8B6F47] px-3 py-1 rounded-full text-sm font-medium">
                                        Featured Event
                                    </span>
                                )}
                            </div>

                            {/* Event Title */}
                            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#4A342E]">{event.title}</h1>

                            {/* Event Image */}
                            {event.coverImage && (
                                <div className="relative aspect-video rounded-xl overflow-hidden mb-8 shadow-lg">
                                    <Image
                                        src={event.coverImage}
                                        alt={`${event.title} — Event image`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            )}

                            {/* Event Details */}
                            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
                                <h2 className="text-xl font-bold mb-4 text-[#4A342E]">Event Details</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-[#6B8E23] mt-1 shrink-0" />
                                        <div>
                                            <p className="font-medium text-[#4A342E]">Date & Time</p>
                                            <p className="text-[#6B5E55]">
                                                {formatDateTimeRange(event.startDate, event.endDate)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-[#6B8E23] mt-1 shrink-0" />
                                        <div>
                                            <p className="font-medium text-[#4A342E]">Location</p>
                                            <p className="text-[#6B5E55]">
                                                {event.isOnline ? (
                                                    <span className="text-[#6B8E23]">🌐 Online Event</span>
                                                ) : (
                                                    `${event.location?.address || ''}${event.location?.address && event.location?.city ? ', ' : ''}${event.location?.city || ''}${event.location?.city && event.location?.country ? ', ' : ''}${event.location?.country || 'Kenya'}`
                                                )}
                                            </p>
                                            {event.location?.mapUrl && !event.isOnline && (
                                                <a
                                                    href={event.location.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#6B8E23] hover:text-[#5A7D1B] text-sm inline-flex items-center gap-1 mt-1"
                                                >
                                                    View on Map
                                                    <ChevronRight size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {event.registration?.capacity && (
                                        <div className="flex items-start gap-3">
                                            <Users className="w-5 h-5 text-[#6B8E23] mt-1 shrink-0" />
                                            <div>
                                                <p className="font-medium text-[#4A342E]">Capacity</p>
                                                <p className="text-[#6B5E55]">
                                                    {event.registration.capacity} seats available
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Event Description */}
                            <div className="prose prose-lg max-w-none mb-8">
                                <div className="text-[#4A342E]" dangerouslySetInnerHTML={{ __html: event.description }} />
                            </div>

                            {/* Schedule (if available) */}
                            {event.schedule && Array.isArray(event.schedule) && event.schedule.length > 0 && (
                                <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4 text-[#4A342E]">Event Schedule</h2>
                                    <div className="space-y-4">
                                        {event.schedule.map((item, index) => (
                                            <div key={index} className="flex gap-4 p-4 bg-[#F5F1EB] rounded-lg">
                                                <div className="text-center">
                                                    <div className="font-bold text-[#6B8E23]">{item.time}</div>
                                                    <div className="text-sm text-[#6B5E55]">{item.duration}</div>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold mb-1 text-[#4A342E]">{item.title}</h4>
                                                    <p className="text-[#6B5E55] text-sm">{item.description}</p>
                                                    {item.speaker && (
                                                        <p className="text-[#6B5E55] text-sm mt-1">Speaker: {item.speaker}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share Event */}
                            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
                                <h3 className="font-bold mb-3 text-[#4A342E]">Share this event</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => shareEvent('facebook')}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Facebook size={20} />
                                    </button>
                                    <button
                                        onClick={() => shareEvent('twitter')}
                                        className="p-2 bg-blue-50 text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Twitter size={20} />
                                    </button>
                                    <button
                                        onClick={() => shareEvent('linkedin')}
                                        className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Linkedin size={20} />
                                    </button>
                                    <button
                                        onClick={() => shareEvent('copy')}
                                        className="p-2 bg-[#F5F1EB] text-[#6B5E55] rounded-lg hover:bg-[#F0E8D9] transition-colors"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Registration & Info */}
                        <div className="space-y-6">
                            {/* Registration Card */}
                            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Ticket className="w-6 h-6 text-[#6B8E23]" />
                                    <h3 className="text-xl font-bold text-[#4A342E]">Registration</h3>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {event.registration?.fee !== undefined && (
                                        <div className="text-center p-4 bg-[#F5F1EB] rounded-lg">
                                            <div className="text-3xl font-bold text-[#4A342E] mb-1">
                                                {event.registration.fee === 0 ? 'FREE' : `KES ${event.registration.fee}`}
                                            </div>
                                            <div className="text-[#6B5E55]">
                                                {event.registration.fee === 0 ? 'No cost to attend' : 'Per person'}
                                            </div>
                                        </div>
                                    )}

                                    {event.registration?.deadline && (
                                        <div className="text-center p-3 bg-[#F0E8D9] rounded-lg">
                                            <p className="text-[#8B6F47] font-medium">
                                                Registration closes: {formatDate(event.registration.deadline)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleRegister}
                                    disabled={registering || eventStatus.label === 'Past Event'}
                                    className={`w-full py-3 rounded-lg font-medium transition-colors ${eventStatus.label === 'Past Event'
                                        ? 'bg-[#F5F1EB] text-[#6B5E55] cursor-not-allowed'
                                        : 'bg-[#6B8E23] text-white hover:bg-[#5A7D1B]'
                                        }`}
                                >
                                    {registering ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </span>
                                    ) : eventStatus.label === 'Past Event' ? (
                                        'Event Ended'
                                    ) : event.registration?.isRequired ? (
                                        'Register Now'
                                    ) : (
                                        'RSVP Now'
                                    )}
                                </button>

                                <p className="text-[#6B5E55] text-sm text-center mt-3">
                                    {event.registration?.capacity ? (
                                        `${event.stats?.registrations || 0} of ${event.registration.capacity} seats filled`
                                    ) : (
                                        `${event.stats?.registrations || 0} people attending`
                                    )}
                                </p>
                            </div>

                            {/* Organizer Info */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h3 className="font-bold mb-4 text-[#4A342E]">Organizer</h3>
                                <div className="space-y-3">
                                    <p className="text-[#4A342E]">{event.createdBy || 'Event Organizer'}</p>

                                    {event.contact && (
                                        <div className="space-y-2">
                                            {event.contact.email && (
                                                <a
                                                    href={`mailto:${event.contact.email}`}
                                                    className="flex items-center gap-2 text-[#6B5E55] hover:text-[#6B8E23]"
                                                >
                                                    <Mail size={16} />
                                                    {event.contact.email}
                                                </a>
                                            )}

                                            {event.contact.phone && (
                                                <a
                                                    href={`tel:${event.contact.phone}`}
                                                    className="flex items-center gap-2 text-[#6B5E55] hover:text-[#6B8E23]"
                                                >
                                                    <Phone size={16} />
                                                    {event.contact.phone}
                                                </a>
                                            )}

                                            {event.contact.website && (
                                                <a
                                                    href={event.contact.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[#6B5E55] hover:text-[#6B8E23]"
                                                >
                                                    <Globe size={16} />
                                                    Visit Website
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-sm">
                                    <h3 className="font-bold mb-3 text-[#4A342E]">Event Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="bg-[#F5F1EB] text-[#4A342E] px-3 py-1 rounded-full text-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Similar Events */}
                    {similarEvents.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-6 text-[#4A342E]">Similar Events</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {similarEvents.map((similarEvent) => (
                                    <Link
                                        key={similarEvent.id}
                                        href={`/events/${similarEvent.slug || similarEvent.id}`}
                                        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                                    >
                                        <div className="relative aspect-video overflow-hidden">
                                            {similarEvent.coverImage ? (
                                                <Image
                                                    src={similarEvent.coverImage}
                                                    alt={`${similarEvent.title} — Event image`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold mb-2 text-[#4A342E] hover:text-[#6B8E23] transition-colors line-clamp-2">
                                                {similarEvent.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-sm text-[#6B5E55]">
                                                <span>{formatDate(similarEvent.startDate)}</span>
                                                <span>
                                                    {similarEvent.isOnline ? 'Online' : 'In-Person'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Back to Events */}
                    <div className="mt-12 text-center">
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 text-[#6B8E23] hover:text-[#5A7D1B] font-medium"
                        >
                            ← Browse All Events
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
