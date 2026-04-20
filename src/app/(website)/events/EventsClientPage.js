// src/app/events/EventsClientPage.jsx
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Search,
    Calendar,
    MapPin,
    Clock,
    Flame,
    ChevronLeft,
    ChevronRight,
    Heart,
    Tag,
    Users,
    ArrowRight,
    ChevronDown,
    Eye,
    MessageCircle,
    Grid,
    List,
    SlidersHorizontal,
    Facebook,
    Share2,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_URL } from "@/app/seo/constants";
import AdsGoogle from '@/components/AdsGoogle';

// Skeleton Loader Components (same as before)
const EventCardSkeleton = ({ viewMode = 'grid' }) => (
    <div className={`bg-white rounded-lg overflow-hidden ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}>
        <div className={`relative ${viewMode === 'list' ? 'w-48 h-32 shrink-0' : 'aspect-video'}`}>
            <div className="w-full h-full bg-[#F5F1EB] animate-pulse"></div>
        </div>
        <div className={viewMode === 'list' ? 'flex-1 space-y-3' : 'p-4 space-y-3'}>
            <div className="flex items-center gap-2">
                <div className="w-24 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="w-16 h-3 bg-[#F5F1EB] rounded animate-pulse ml-auto"></div>
            </div>
            <div className="space-y-2">
                <div className="w-full h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
            </div>
            <div className="w-5/6 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-12 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-14 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
                <div className="w-20 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
            </div>
        </div>
    </div>
);

const CalendarSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="flex justify-between">
            <div className="w-8 h-8 bg-[#F5F1EB] rounded-full animate-pulse"></div>
            <div className="w-32 h-6 bg-[#F5F1EB] rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-[#F5F1EB] rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-8 h-4 bg-[#F5F1EB] rounded animate-pulse mx-auto"></div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="w-8 h-8 bg-[#F5F1EB] rounded-lg animate-pulse mx-auto"></div>
            ))}
        </div>
        <div className="w-full h-10 bg-[#F5F1EB] rounded-lg animate-pulse"></div>
        <div className="pt-6 border-t space-y-3">
            <div className="w-24 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#F5F1EB] space-y-2">
                    <div className="w-3/4 h-3 bg-[#FFFFFF] rounded animate-pulse"></div>
                    <div className="w-1/2 h-2 bg-[#FFFFFF] rounded animate-pulse"></div>
                </div>
            ))}
        </div>
    </div>
);

const StatsSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="h-6 w-32 bg-[#F5F1EB] rounded animate-pulse"></div>
        <div className="space-y-3">
            <div className="space-y-2">
                <div className="flex justify-between">
                    <div className="w-20 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-8 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
                <div className="w-full h-2 bg-[#F5F1EB] rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <div className="w-20 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-8 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
                <div className="w-full h-2 bg-[#F5F1EB] rounded-full animate-pulse"></div>
            </div>
        </div>
        <div className="pt-4 border-t">
            <div className="text-center space-y-2">
                <div className="w-16 h-8 bg-[#F5F1EB] rounded animate-pulse mx-auto"></div>
                <div className="w-24 h-3 bg-[#F5F1EB] rounded animate-pulse mx-auto"></div>
            </div>
        </div>
    </div>
);

const FeaturedEventSkeleton = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <div className="md:flex">
            <div className="md:w-1/2 aspect-video bg-[#F5F1EB] animate-pulse"></div>
            <div className="md:w-1/2 p-6 md:p-8 space-y-4">
                <div className="w-24 h-6 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="w-3/4 h-8 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="space-y-3">
                    <div className="w-48 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-40 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-32 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
                <div className="w-full h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="w-2/3 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                <div className="flex justify-between">
                    <div className="w-20 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                    <div className="w-16 h-3 bg-[#F5F1EB] rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    </div>
);

const CTASkeleton = () => (
    <div className="bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9] rounded-lg shadow p-5 space-y-4">
        <div className="w-32 h-6 bg-[#FFFFFF] rounded animate-pulse"></div>
        <div className="space-y-2">
            <div className="w-full h-3 bg-[#FFFFFF] rounded animate-pulse"></div>
            <div className="w-5/6 h-3 bg-[#FFFFFF] rounded animate-pulse"></div>
        </div>
        <div className="w-full h-10 bg-[#FFFFFF] rounded-lg animate-pulse"></div>
        <div className="w-48 h-2 bg-[#FFFFFF] rounded animate-pulse mx-auto"></div>
    </div>
);

const CategoriesSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="h-6 w-32 bg-[#F5F1EB] rounded animate-pulse"></div>
        <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-16 h-8 bg-[#F5F1EB] rounded-xl animate-pulse"></div>
            ))}
        </div>
    </div>
);

const SocialLinksSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="h-6 w-32 bg-[#F5F1EB] rounded animate-pulse mx-auto"></div>
        <div className="flex justify-center gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-10 h-10 bg-[#F5F1EB] rounded-full animate-pulse"></div>
            ))}
        </div>
    </div>
);

/* ---------------- HELPERS ---------------- */
const formatDate = (date) =>
    date?.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const formatTime = (date) =>
    date?.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

const dateKey = (date) => date.toISOString().split("T")[0];

const daysFromNow = (date) =>
    Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const startDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

/* ---------------- PAGINATION COMPONENT ---------------- */
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
    const maxVisiblePages = 5;

    const getPageNumbers = () => {
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(currentPage - half, 1);
        let end = Math.min(start + maxVisiblePages - 1, totalPages);

        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(end - maxVisiblePages + 1, 1);
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-[#6B5E55]">
                Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-[#F5F1EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                >
                    <ChevronsLeft size={16} />
                </button>

                {/* Previous Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-[#F5F1EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page Numbers */}
                {pageNumbers.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`min-w-10 h-10 rounded-lg transition-colors ${currentPage === page
                            ? 'bg-[#6B8E23] text-white'
                            : 'text-[#4A342E] hover:bg-[#F5F1EB]'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-[#F5F1EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-[#F5F1EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>

            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-[#6B5E55]">Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                    className="text-sm border border-[#F5F1EB] rounded-lg px-2 py-1 focus:outline-none focus:border-[#6B8E23]"
                >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="36">36</option>
                </select>
            </div>
        </div>
    );
};

/* ---------------- PAGE ---------------- */

export default function EventsClientPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalEvents, setTotalEvents] = useState(0);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const [selectedDate, setSelectedDate] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    /* -------- SAVED EVENTS (❤️) -------- */
    const [savedEvents, setSavedEvents] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("savedEvents");
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error("Error reading saved events:", error);
                return [];
            }
        }
        return [];
    });

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        async function fetchEvents() {
            try {
                // Fetch ALL events (including past) for client-side filtering
                const res = await fetch('/api/events?upcoming=false&limit=1000');
                const json = await res.json();

                if (!json.success) {
                    throw new Error(json.error || 'Failed to fetch events');
                }

                const data = (json.data.events || []).map((e) => ({
                    ...e,
                    startDate: e.startDate ? new Date(e.startDate) : null,
                    endDate: e.endDate ? new Date(e.endDate) : null,
                    // Parse location if it's a JSON string
                    location: typeof e.location === 'string' ? (() => { try { return JSON.parse(e.location); } catch { return null; } })() : e.location,
                }));

                setEvents(data);
                setTotalEvents(data.length);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError('Failed to load events');
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    /* -------- PERSIST SAVED EVENTS -------- */
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
            } catch (error) {
                console.error("Error saving events:", error);
            }
        }
    }, [savedEvents]);

    /* ---------------- RESPONSIVE ---------------- */
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    /* ---------------- FILTERING & PAGINATION ---------------- */
    const filteredEvents = useMemo(() => {
        const now = new Date();

        return events.filter((e) => {
            const matchesSearch =
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.description?.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                category === "all" || e.category === category;

            const matchesType = selectedType === "all" ||
                (selectedType === "online" && e.isOnline) ||
                (selectedType === "in-person" && !e.isOnline);

            const eventDate = new Date(e.startDate);
            const matchesDate = showPastEvents ? true : eventDate >= now;

            return matchesSearch && matchesCategory && matchesType && matchesDate;
        });
    }, [events, search, category, selectedType, showPastEvents]);

    // Calculate paginated events
    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredEvents.slice(startIndex, endIndex);
    }, [filteredEvents, currentPage, itemsPerPage]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, category, selectedType, showPastEvents]);

    const eventsByDate = useMemo(() => {
        const map = {};
        filteredEvents.forEach((e) => {
            const key = dateKey(e.startDate);
            if (!map[key]) map[key] = [];
            map[key].push(e);
        });
        return map;
    }, [filteredEvents]);

    const happeningSoon = filteredEvents.filter(
        (e) => daysFromNow(e.startDate) <= 7 && daysFromNow(e.startDate) >= 0
    );

    const upcoming = filteredEvents.filter(
        (e) => daysFromNow(e.startDate) > 7
    );

    const featuredEvent = filteredEvents.find(e => e.featured);

    // Get featured event from filtered events, not from paginated
    const otherEvents = paginatedEvents.filter(e => !e.featured || e.id !== featuredEvent?.id);

    /* ---------------- EVENT STATUS ---------------- */
    const getEventStatus = useCallback((startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        if (now < start) {
            const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) return { label: 'Starting Soon', color: 'bg-blue-100 text-blue-800' };
            return { label: 'Upcoming', color: 'bg-[#F5F1EB] text-[#4A342E]' };
        } else if (end && now <= end) {
            return { label: 'Ongoing', color: 'bg-[#F0E8D9] text-[#8B6F47]' };
        } else {
            return { label: 'Past', color: 'bg-[#F5F1EB] text-[#6B5E55]' };
        }
    }, []);

    /* ---------------- ACTIONS ---------------- */
    const jumpToToday = () => {
        const now = new Date();
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(dateKey(now));
        document
            .getElementById("calendar-section")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleSave = (id, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setSavedEvents((prev) =>
            prev.includes(id)
                ? prev.filter((e) => e !== id)
                : [...prev, id]
        );
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to first page
    };

    const categories = ["all", "Technology", "Business", "Arts & Culture", "Sports", "Community", "Entertainment", "Education"];
    const eventTypes = ["all", "online", "in-person"];

    if (error) {
        return (
            <div className="min-h-screen bg-[#F5F1EB]">
                <div className="py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold mb-2 text-[#4A342E]">Something went wrong</h2>
                            <p className="text-[#6B5E55] mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-[#6B8E23] text-white px-6 py-2 rounded-lg hover:bg-[#5A7D1B]"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F1EB]">
            {/* Structured data for events listing */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        'itemListElement': events.slice(0, 10).map((event, index) => ({
                            '@type': 'ListItem',
                            'position': index + 1,
                            'item': {
                                '@type': 'Event',
                                'name': event.title,
                                'description': event.description || event.excerpt,
                                'startDate': event.startDate.toISOString(),
                                'endDate': event.endDate?.toISOString(),
                                'eventAttendanceMode': event.isOnline ?
                                    'https://schema.org/OnlineEventAttendanceMode' :
                                    'https://schema.org/OfflineEventAttendanceMode',
                                'location': event.isOnline ? {
                                    '@type': 'VirtualLocation',
                                    'url': event.onlineUrl || `${SITE_URL}/events/${event.slug || event.id}`
                                } : {
                                    '@type': 'Place',
                                    'name': event.location?.venue || 'Location TBD',
                                    'address': {
                                        '@type': 'PostalAddress',
                                        'addressLocality': event.location?.city,
                                        'addressCountry': event.location?.country || 'KE'
                                    }
                                },
                                'image': event.coverImage,
                                'url': `${SITE_URL}/events/${event.slug || event.id}`,
                                'offers': {
                                    '@type': 'Offer',
                                    'price': event.registration?.fee || 0,
                                    'priceCurrency': 'KES',
                                    'availability': 'https://schema.org/InStock',
                                    'validFrom': new Date().toISOString()
                                }
                            }
                        }))
                    })
                }}
            />

            {/* ---------------- HERO ---------------- */}
            <section className="bg-linear-to-t from-[#F5F1EB] via-[#E7DDD1] to-[#D6C4AE] py-12 md:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-[#4A342E]">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                            Discover Amazing Events
                        </h1>

                        <p className="text-[#6B5E55] mb-8 md:mb-10 text-sm md:text-base">
                            Workshops, meetups, concerts & creative gatherings in Kenya
                        </p>

                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search events by name, location, or category..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-6 py-4 pr-12 rounded-xl bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5E55] w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ---------------- BODY ---------------- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content - 3 columns */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Search and Filter Section */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative flex-1 w-full">
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                                    />
                                    <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:flex-none">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full md:w-48 px-4 py-3 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat === 'all' ? 'All Categories' : cat}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] w-4 h-4 pointer-events-none" />
                                    </div>

                                    <div className="relative flex-1 md:flex-none">
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full md:w-40 px-4 py-3 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                                        >
                                            {eventTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type === 'all' ? 'All Types' : type === 'online' ? 'Online' : 'In-Person'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] w-4 h-4 pointer-events-none" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#F5F1EB] text-[#6B8E23]' : 'text-[#6B5E55] hover:bg-[#F5F1EB]'}`}
                                        >
                                            <Grid size={20} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#F5F1EB] text-[#6B8E23]' : 'text-[#6B5E55] hover:bg-[#F5F1EB]'}`}
                                        >
                                            <List size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#F5F1EB]">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setShowPastEvents(!showPastEvents)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${showPastEvents
                                                ? 'bg-[#F0E8D9] text-[#8B6F47]'
                                                : 'bg-[#F5F1EB] text-[#6B5E55] hover:bg-[#F0E8D9]'
                                                }`}
                                        >
                                            {showPastEvents ? 'Hide Past Events' : 'Show Past Events'}
                                        </button>
                                    </div>
                                    <div className="text-sm text-[#6B5E55]">
                                        {loading ? (
                                            <div className="w-32 h-4 bg-[#F5F1EB] rounded animate-pulse"></div>
                                        ) : (
                                            `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredEvents.length)}-${Math.min(currentPage * itemsPerPage, filteredEvents.length)} of ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Featured Event */}
                        {loading ? (
                            <FeaturedEventSkeleton />
                        ) : featuredEvent && (
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
                                                        <>
                                                            <span className="text-sm">to</span>
                                                            <span className="text-sm">{formatDate(featuredEvent.endDate)}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[#6B5E55]">
                                                    <MapPin size={18} />
                                                    <span className="text-sm">
                                                        {featuredEvent.isOnline
                                                            ? 'Online Event'
                                                            : `${featuredEvent.location?.city || 'Location TBD'}, ${featuredEvent.location?.country || 'Kenya'}`
                                                        }
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
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#6B8E23] font-medium flex items-center gap-2">
                                                    View Details
                                                    <ArrowRight size={16} />
                                                </span>
                                                {featuredEvent.registration?.fee !== undefined && (
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${featuredEvent.registration.fee === 0
                                                        ? 'bg-[#F5F1EB] text-[#4A342E]'
                                                        : 'bg-[#F5F1EB] text-[#6B5E55]'
                                                        }`}>
                                                        {featuredEvent.registration.fee === 0 ? 'Free' : `KES ${featuredEvent.registration.fee}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Happening Soon Section */}
                        {loading ? (
                            <div>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#4A342E]">
                                    <Flame className="text-[#6B8E23] w-5 h-5" />
                                    Happening This Week
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <EventCardSkeleton key={index} viewMode={viewMode} />
                                    ))}
                                </div>
                            </div>
                        ) : happeningSoon.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#4A342E]">
                                    <div className="w-2 h-6 bg-[#6B8E23] rounded"></div>
                                    Happening This Week
                                </h2>

                                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
                                    {happeningSoon.slice(0, 4).map((event) => (
                                        <div
                                            key={event.id}
                                            className={`bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}
                                        >
                                            <Link
                                                href={`/events/${event.slug || event.id}`}
                                                className={`block ${viewMode === 'list' ? 'w-48 h-32 shrink-0' : ''}`}
                                            >
                                                <div className={`relative ${viewMode === 'list' ? 'w-full h-full' : 'aspect-video'}`}>
                                                    {event.coverImage ? (
                                                        <Image
                                                            src={event.coverImage}
                                                            alt={`${event.title} — Event image`}
                                                            fill
                                                            className="object-cover"
                                                            sizes={viewMode === 'list' ? "192px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                                    )}
                                                    <div className="absolute top-3 left-3">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventStatus(event.startDate, event.endDate).color}`}>
                                                            {getEventStatus(event.startDate, event.endDate).label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className={viewMode === 'list' ? 'flex-1' : 'p-4'}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-xs font-semibold text-[#6B8E23] bg-[#F5F1EB] px-2 py-1 rounded">
                                                        In {daysFromNow(event.startDate)} days
                                                    </span>
                                                    <button
                                                        onClick={(e) => toggleSave(event.id, e)}
                                                        className="p-1.5 hover:bg-[#F5F1EB] rounded-full transition-colors"
                                                    >
                                                        <Heart
                                                            className={`w-5 h-5 ${savedEvents.includes(event.id)
                                                                ? "fill-red-500 text-red-500"
                                                                : "text-[#6B5E55]"
                                                                }`}
                                                        />
                                                    </button>
                                                </div>

                                                <Link href={`/events/${event.slug || event.id}`}>
                                                    <h3 className={`font-bold text-[#4A342E] hover:text-[#6B8E23] transition-colors ${viewMode === 'list' ? 'text-lg mb-2' : 'mb-2'}`}>
                                                        {event.title}
                                                    </h3>
                                                </Link>

                                                <div className={`space-y-2 text-sm text-[#6B5E55] ${viewMode === 'list' ? 'mb-3' : 'mb-3'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(event.startDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} />
                                                        <span>{formatTime(event.startDate)}</span>
                                                    </div>
                                                    {event.location?.city && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={14} />
                                                            <span>{event.isOnline ? "Online" : event.location.city}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    {event.registration?.fee !== undefined && (
                                                        <span className={`text-sm font-medium ${event.registration.fee === 0
                                                            ? 'text-[#6B8E23]'
                                                            : 'text-[#4A342E]'
                                                            }`}>
                                                            {event.registration.fee === 0 ? 'Free' : `KES ${event.registration.fee}`}
                                                        </span>
                                                    )}
                                                    <Link
                                                        href={`/events/${event.slug || event.id}`}
                                                        className="text-[#6B8E23] hover:text-[#5A7D1B] text-sm font-medium flex items-center gap-1"
                                                    >
                                                        View Details
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Events */}
                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#4A342E]">
                                <div className="w-2 h-6 bg-[#8B6F47] rounded"></div>
                                Upcoming Events
                            </h2>

                            {loading ? (
                                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <EventCardSkeleton key={index} viewMode={viewMode} />
                                    ))}
                                </div>
                            ) : otherEvents.length > 0 ? (
                                <>
                                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
                                        {otherEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}
                                            >
                                                <Link
                                                    href={`/events/${event.slug || event.id}`}
                                                    className={`block ${viewMode === 'list' ? 'w-48 h-32 shrink-0' : ''}`}
                                                >
                                                    <div className={`relative ${viewMode === 'list' ? 'w-full h-full' : 'aspect-video'}`}>
                                                        {event.coverImage ? (
                                                            <Image
                                                                src={event.coverImage}
                                                                alt={`${event.title} — Event image`}
                                                                fill
                                                                className="object-cover"
                                                                sizes={viewMode === 'list' ? "192px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9]"></div>
                                                        )}
                                                        <div className="absolute top-3 left-3">
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventStatus(event.startDate, event.endDate).color}`}>
                                                                {getEventStatus(event.startDate, event.endDate).label}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => toggleSave(event.id, e)}
                                                            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors backdrop-blur-sm"
                                                        >
                                                            <Heart
                                                                className={`w-4 h-4 ${savedEvents.includes(event.id)
                                                                    ? "fill-red-500 text-red-500"
                                                                    : "text-[#6B5E55]"
                                                                    }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </Link>

                                                <div className={viewMode === 'list' ? 'flex-1' : 'p-4'}>
                                                    <div className={`flex items-center justify-between ${viewMode === 'list' ? 'mb-2' : 'mb-3'}`}>
                                                        <span className="text-xs text-[#6B5E55]">
                                                            {formatDate(event.startDate)}
                                                        </span>
                                                        {event.category && (
                                                            <span className="flex items-center gap-1 text-xs text-[#6B5E55]">
                                                                <Tag size={12} />
                                                                {event.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Link href={`/events/${event.slug || event.id}`}>
                                                        <h3 className={`font-bold text-[#4A342E] hover:text-[#6B8E23] transition-colors ${viewMode === 'list' ? 'text-lg mb-2' : 'mb-2'}`}>
                                                            {event.title}
                                                        </h3>
                                                    </Link>

                                                    <p className={`text-[#6B5E55] ${viewMode === 'list' ? 'text-sm mb-3' : 'text-sm mb-3 line-clamp-2'}`}>
                                                        {event.excerpt || event.description?.substring(0, 100)}...
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs text-[#6B5E55]">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                {event.isOnline ? 'Online' : event.location?.city || 'TBD'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {formatTime(event.startDate)}
                                                            </span>
                                                        </div>

                                                        <Link
                                                            href={`/events/${event.slug || event.id}`}
                                                            className="text-[#6B8E23] hover:text-[#5A7D1B] text-sm font-medium flex items-center gap-1"
                                                        >
                                                            Details
                                                            <ArrowRight size={14} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-8 pt-8 border-t border-[#F5F1EB]">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={handlePageChange}
                                                itemsPerPage={itemsPerPage}
                                                onItemsPerPageChange={handleItemsPerPageChange}
                                            />
                                        </div>
                                    )}

                                    {/* No Events Found */}
                                    {filteredEvents.length === 0 && !loading && (
                                        <div className="text-center py-16 bg-white rounded-lg shadow">
                                            <div className="text-[#6B5E55] text-5xl mb-4">📅</div>
                                            <h3 className="text-xl font-bold mb-2 text-[#4A342E]">No events found</h3>
                                            <p className="text-[#6B5E55] mb-4">
                                                {search
                                                    ? `No events match "${search}"`
                                                    : 'No events scheduled at the moment'
                                                }
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSearch('');
                                                    setCategory('all');
                                                    setSelectedType('all');
                                                    setShowPastEvents(false);
                                                }}
                                                className="text-[#6B8E23] hover:text-[#5A7D1B] font-medium"
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-lg shadow">
                                    <div className="text-[#6B5E55] text-5xl mb-4">📅</div>
                                    <h3 className="text-xl font-bold mb-2 text-[#4A342E]">No upcoming events</h3>
                                    <p className="text-[#6B5E55] mb-4">Check back soon for new events!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ---------------- SIDEBAR ---------------- */}
                    <div className="space-y-6">
                        {/* Google AdSense Ad in sidebar */}
                        <div style={{ margin: '0 0 24px 0', display: 'flex', justifyContent: 'center' }}>
                            <AdsGoogle slot="5074357227" style={{ display: 'block', minHeight: 250, minWidth: 200, width: '100%' }} />
                        </div>
                        {/* CALENDAR SECTION */}
                        <div className="bg-white rounded-lg shadow p-5" id="calendar-section">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#4A342E]">
                                <div className="w-2 h-6 bg-[#8B6F47] rounded"></div>
                                Event Calendar
                            </h3>

                            {loading ? (
                                <CalendarSkeleton />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <button
                                            onClick={() =>
                                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                                            }
                                            className="p-2 hover:bg-[#F5F1EB] rounded-full"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <h4 className="font-semibold text-base text-[#4A342E]">
                                            {currentMonth.toLocaleDateString("en-US", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </h4>

                                        <button
                                            onClick={() =>
                                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                                            }
                                            className="p-2 hover:bg-[#F5F1EB] rounded-full"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="mb-6">
                                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#6B5E55] mb-2">
                                            {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
                                                <div key={`${d}-${index}`} className="p-1">
                                                    {d}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({
                                                length: startDay(currentMonth) + daysInMonth(currentMonth),
                                            }).map((_, i) => {
                                                if (i < startDay(currentMonth))
                                                    return <div key={`empty-${i}`} className="aspect-square" />;

                                                const day = i - startDay(currentMonth) + 1;
                                                const date = new Date(
                                                    currentMonth.getFullYear(),
                                                    currentMonth.getMonth(),
                                                    day
                                                );
                                                const key = dateKey(date);
                                                const isToday = dateKey(new Date()) === key;
                                                const hasEvents = eventsByDate[key];

                                                return (
                                                    <button
                                                        key={`day-${key}`}
                                                        onClick={() => setSelectedDate(key)}
                                                        className={`aspect-square rounded-lg text-sm flex items-center justify-center relative
                                                            ${isToday ? "bg-[#F0E8D9] text-[#8B6F47] font-semibold" : ""}
                                                            ${selectedDate === key ? "ring-2 ring-[#6B8E23]" : ""}
                                                            ${hasEvents ? "bg-[#F5F1EB] text-[#6B8E23] hover:bg-[#F0E8D9]" : "hover:bg-[#F5F1EB]"}
                                                        `}
                                                    >
                                                        {day}
                                                        {hasEvents && (
                                                            <div className="absolute bottom-1 w-1 h-1 bg-[#6B8E23] rounded-full"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {selectedDate && eventsByDate[selectedDate] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-6 pt-6 border-t border-[#F5F1EB]"
                                            >
                                                <h4 className="font-semibold mb-4 text-sm text-[#4A342E]">
                                                    Events on {selectedDate}
                                                </h4>

                                                <div className="space-y-3">
                                                    {eventsByDate[selectedDate].map((event, index) => (
                                                        <Link
                                                            key={`${event.id}-${index}`}
                                                            href={`/events/${event.slug || event.id}`}
                                                            className="block p-3 rounded-lg bg-[#F5F1EB] hover:bg-[#F0E8D9] transition-colors"
                                                        >
                                                            <p className="font-medium text-sm text-[#4A342E]">{event.title}</p>
                                                            <p className="text-xs text-[#6B5E55] mt-1">
                                                                {formatTime(event.startDate)} · {event.isOnline ? "Online" : event.location?.city || "TBD"}
                                                            </p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={jumpToToday}
                                        className="mt-6 w-full py-3 rounded-lg bg-[#6B8E23] text-white hover:bg-[#5A7D1B] transition-colors font-medium"
                                    >
                                        Jump to Today
                                    </button>
                                </>
                            )}
                        </div>

                        {/* QUICK STATS */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#4A342E]">
                                <div className="w-2 h-6 bg-[#8B6F47] rounded"></div>
                                Event Stats
                            </h3>
                            {loading ? (
                                <StatsSkeleton />
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-[#6B5E55]">This Week</span>
                                            <span className="font-semibold text-[#4A342E]">{happeningSoon.length}</span>
                                        </div>
                                        <div className="w-full bg-[#F5F1EB] rounded-full h-2">
                                            <div
                                                className="bg-[#6B8E23] h-2 rounded-full"
                                                style={{ width: `${Math.min((happeningSoon.length / Math.max(events.length, 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm text-[#6B5E55]">Upcoming</span>
                                            <span className="font-semibold text-[#4A342E]">{upcoming.length}</span>
                                        </div>
                                        <div className="w-full bg-[#F5F1EB] rounded-full h-2">
                                            <div
                                                className="bg-[#8B6F47] h-2 rounded-full"
                                                style={{ width: `${Math.min((upcoming.length / Math.max(events.length, 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-[#F5F1EB]">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[#6B8E23]">{filteredEvents.length}</div>
                                            <div className="text-sm text-[#6B5E55]">Total Events</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CALL TO ACTION */}
                        <div className="bg-linear-to-br from-[#F5F1EB] to-[#F0E8D9] rounded-lg shadow p-5">
                            {loading ? (
                                <CTASkeleton />
                            ) : (
                                <>
                                    <h3 className="font-bold text-lg mb-2 text-[#4A342E]">Hosting an Event?</h3>
                                    <p className="text-sm text-[#6B5E55] mb-4">
                                        Share your creative event with our community and reach thousands of interested attendees.
                                    </p>
                                    <button className="w-full bg-[#6B8E23] text-white py-3 rounded-lg hover:bg-[#5A7D1B] font-medium transition-colors">
                                        Submit Your Event
                                    </button>
                                    <p className="text-xs text-[#6B5E55] mt-3 text-center">
                                        Free to list for community events
                                    </p>
                                </>
                            )}
                        </div>

                        {/* CATEGORIES */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#4A342E]">
                                <div className="w-2 h-6 bg-[#6B8E23] rounded"></div>
                                Categories
                            </h3>
                            {loading ? (
                                <CategoriesSkeleton />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setCategory('all')}
                                        className={`px-2 py-0.5 rounded-xl text-sm transition-colors ${category === 'all' ? 'bg-[#6B8E23] text-white' : 'bg-[#F5F1EB] text-[#6B5E55] hover:bg-[#F0E8D9]'}`}
                                    >
                                        All
                                    </button>
                                    {categories.filter(c => c !== 'all').map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-2 py-0.5 rounded-xl text-sm transition-colors ${category === cat ? 'bg-[#6B8E23] text-white' : 'bg-[#F5F1EB] text-[#6B5E55] hover:bg-[#F0E8D9]'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SOCIAL LINKS */}
                        <div className="bg-white rounded-lg shadow p-5">
                            {loading ? (
                                <SocialLinksSkeleton />
                            ) : (
                                <>
                                    <h3 className="font-bold text-lg mb-4 text-center text-[#4A342E]">Follow for Updates</h3>
                                    <div className="flex justify-center gap-3">
                                        <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                            <Facebook size={20} className="text-white" />
                                        </button>
                                        <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                                            <span className="text-white font-semibold">X</span>
                                        </button>
                                        <button className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                                            <span className="text-white font-semibold">IG</span>
                                        </button>
                                        <button className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                                            <span className="text-white font-semibold">YT</span>
                                        </button>
                                        <button className="w-10 h-10 bg-[#6B8E23] rounded-full flex items-center justify-center hover:bg-[#5A7D1B] transition-colors">
                                            <Share2 size={18} className="text-white" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}