import { generateHomeMetadata } from '../seo/meta';
import { SITE_NAME, SITE_URL } from '../seo/constants';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, ArrowRight, ChevronRight, Eye, Calendar, User, MapPin } from 'lucide-react';
import HeroCarousel from './_components/HeroCarousel';
import LikeButton from './_components/LikeButton';
import NewsletterForm from './_components/NewsletterForm';
import AdsGoogle from '@/components/AdsGoogle';

export const metadata = generateHomeMetadata();

// ── Internal fetch helper ────────────────────────────────────

async function getBaseUrl() {
    // On Vercel, use the host from the incoming request headers (most reliable)
    const headersList = await headers();
    const host = headersList.get('host') || headersList.get('x-forwarded-host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    if (host) return `${protocol}://${host}`;
    // Fallback env vars
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    return 'http://localhost:3000';
}

async function apiFetch(path, options = {}) {
    const base = await getBaseUrl();
    const url = `${base}${path}`;
    const res = await fetch(url, { cache: 'no-store', ...options });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API request failed');
    return json.data;
}

// ── Helper functions (plain, not hooks) ──────────────────────────

function formatDate(date) {
    if (!date) return 'Recently';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTimeAgo(date) {
    if (!date) return 'Now';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(date);
}

function formatEventDate(startDate, endDate) {
    if (!startDate) return 'Date TBD';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (!end || start.toDateString() === end.toDateString()) {
        return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// ── Server-side data fetching via API ─────────────────────────────

async function fetchArticles(limit = 12) {
    try {
        const data = await apiFetch(`/api/posts?limit=${limit}`);
        return data.posts || [];
    } catch { return []; }
}

async function fetchPopularArticles(limit = 3) {
    try {
        const data = await apiFetch(`/api/posts?sort=views&sortDir=desc&limit=${limit}`);
        return data.posts || [];
    } catch { return []; }
}

async function fetchFeaturedArticle() {
    try {
        const data = await apiFetch('/api/posts?featured=1&limit=1');
        const posts = data.posts || [];
        if (posts.length > 0) return posts[0];
        // Fallback to latest
        const latest = await apiFetch('/api/posts?limit=1');
        const latestPosts = latest.posts || [];
        return latestPosts.length > 0 ? latestPosts[0] : null;
    } catch { return null; }
}

async function fetchRecentStories(limit = 5) {
    try {
        const data = await apiFetch(`/api/posts?limit=${limit}`);
        return data.posts || [];
    } catch { return []; }
}

async function fetchCategories() {
    try {
        const data = await apiFetch('/api/categories');
        return data.categories || [];
    } catch { return []; }
}

async function fetchUpcomingEvents(limit = 4) {
    try {
        const data = await apiFetch(`/api/events?upcoming=true&limit=${limit}`);
        return data.events || [];
    } catch { return []; }
}

// ── Page component ───────────────────────────────────────────────

export default async function HomePage() {
    // Force dynamic rendering
    await cookies();

    // Fetch all data in parallel
    const [articles, popularArticles, featuredArticle, recentStories, categories, upcomingEvents] =
        await Promise.all([
            fetchArticles(12),
            fetchPopularArticles(3),
            fetchFeaturedArticle(),
            fetchRecentStories(5),
            fetchCategories(),
            fetchUpcomingEvents(4),
        ]);

    // Show first 6 articles in the grid
    const displayArticles = articles.slice(0, 6);

    // Build category lookup map for badge display
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_NAME,
        'url': SITE_URL,
        'description': 'High-quality articles, insights, and updates on architecture, design, and technology.',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <div className="min-h-screen bg-[#f5f1e8]">
                {/* Hero Carousel Section */}
                <HeroCarousel />

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="flex flex-wrap gap-6 lg:gap-8">
                        {/* Articles Section */}
                        <div className="flex-1 min-w-75">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Latest from the Creative Ecosystem</h2>
                                    <p className="text-gray-600 text-xs sm:text-sm">Explore in-depth profiles, cultural analysis, and visual storytelling from Kenya&apos;s vibrant art scene</p>
                                </div>
                                <Link
                                    href="/blogs"
                                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm sm:text-base"
                                >
                                    View All Articles
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            {/* Articles Grid */}
                            <div className="articles-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                                {displayArticles.length > 0 ? (
                                    displayArticles.map((article) => (
                                        <Link
                                            key={article.id}
                                            href={`/blogs/${article.slug || article.id}`}
                                            className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group block"
                                        >
                                            <div className="relative aspect-4/3 overflow-hidden group">
                                                {(article.coverImage || article.featuredImage) ? (
                                                    <Image
                                                        src={article.coverImage || article.featuredImage}
                                                        alt={`${article.title} — Featured image`}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        priority={false}
                                                        unoptimized
                                                        sizes="(max-width: 768px) 100vw, 400px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                                                        <User className="w-12 h-12 text-gray-500" />
                                                    </div>
                                                )}

                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className="bg-gray-800/80 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
                                                        {article.publishedAt ? formatDate(article.publishedAt) : 'Recent'}
                                                    </span>
                                                    {article.categoryIds && article.categoryIds[0] && (
                                                        <span className="bg-orange-500/90 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
                                                            {categoryMap.get(article.categoryIds[0]) || 'Uncategorized'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <h3 className="font-bold mb-2 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                    {article.title}
                                                </h3>
                                                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                                                    <span dangerouslySetInnerHTML={{ __html: article.excerpt }} />
                                                </p>
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={14} />
                                                            {article.stats?.comments || 0}
                                                        </span>

                                                        <LikeButton
                                                            postId={article.id}
                                                            initialLikes={article.stats?.likes || 0}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 truncate max-w-25">
                                                        {article.authorSnapshot?.name || article.author?.name || 'Anonymous'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <div className="text-gray-400 mb-4">No articles found</div>
                                        <p className="text-gray-600 text-sm">Check back soon for new content!</p>
                                    </div>
                                )}
                            </div>

                            {/* Popular Articles Section */}
                            <div className="mb-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900">
                                            Popular Articles
                                        </h2>
                                        <p className="text-gray-600 text-xs sm:text-sm">
                                            Most read articles from our community
                                        </p>
                                    </div>

                                    <Link
                                        href="/blogs/popular"
                                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                    >
                                        View All Popular
                                    </Link>
                                </div>

                                {/* Unified grid for desktop + mobile */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Main Article */}
                                    {popularArticles[0] && (
                                        <Link
                                            href={`/blogs/${popularArticles[0].slug || popularArticles[0].id}`}
                                            className="relative h-60 md:h-full rounded-lg overflow-hidden group block"
                                        >
                                            {(popularArticles[0].coverImage || popularArticles[0].featuredImage) ? (
                                                <Image
                                                    src={popularArticles[0].coverImage || popularArticles[0].featuredImage}
                                                    alt={popularArticles[0].title}
                                                    fill
                                                    priority
                                                    unoptimized
                                                    sizes="(max-width: 768px) 100vw, 600px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-linear-to-br from-gray-300 to-gray-600" />
                                            )}

                                            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

                                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                                <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2">
                                                    {popularArticles[0].title}
                                                </h3>
                                                <div
                                                    className="mt-1 text-xs text-gray-200 line-clamp-2"
                                                    dangerouslySetInnerHTML={{ __html: popularArticles[0].excerpt }}
                                                />
                                            </div>
                                        </Link>
                                    )}

                                    {/* Other Articles */}
                                    <div className="flex flex-col gap-4 h-full">
                                        {popularArticles.slice(1, 3).map((article) => (
                                            <Link
                                                key={article.id}
                                                href={`/blogs/${article.slug || article.id}`}
                                                className="flex gap-3 flex-1 rounded-lg bg-white overflow-hidden group block"
                                            >
                                                {/* Image */}
                                                <div className="relative w-32 h-full shrink-0">
                                                    {(article.coverImage || article.featuredImage) ? (
                                                        <Image
                                                            src={article.coverImage || article.featuredImage}
                                                            alt={article.title}
                                                            fill
                                                            unoptimized
                                                            sizes="128px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-gray-300 to-gray-600" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex flex-col justify-between py-2 pr-2 flex-1">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:underline">
                                                            {article.title}
                                                        </h4>
                                                        <div
                                                            className="mt-1 text-xs text-gray-600 line-clamp-2"
                                                            dangerouslySetInnerHTML={{ __html: article.excerpt }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                        <span className="truncate max-w-[110px]">
                                                            {article.authorSnapshot?.name || article.author?.name || 'Anonymous'}
                                                        </span>

                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-1">
                                                                <MessageCircle size={13} />
                                                                {article.stats?.comments || 0}
                                                            </span>

                                                            <LikeButton
                                                                postId={article.id}
                                                                initialLikes={article.stats?.likes || 0}
                                                                className="[&_svg]:size-[13px]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-80 space-y-6">
                            {/* Featured Article */}
                            <div className="bg-white rounded-lg p-4">
                                <h3 className="font-bold mb-4">Featured Article</h3>
                                {featuredArticle ? (
                                    <Link
                                        href={`/blogs/${featuredArticle.slug || featuredArticle.id}`}
                                        className="block"
                                    >
                                        <div className="relative h-32 md:h-40 bg-linear-to-br from-gray-200 to-gray-400 rounded mb-3 overflow-hidden group">
                                            {(featuredArticle.coverImage || featuredArticle.featuredImage) && (
                                                <Image
                                                    src={featuredArticle.coverImage || featuredArticle.featuredImage}
                                                    alt={`${featuredArticle.title} — Featured image`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    priority
                                                    sizes="(max-width: 768px) 100vw, 600px"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm mb-2 hover:text-orange-600 transition-colors">{featuredArticle.title}</h4>
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{featuredArticle.excerpt}</p>
                                        <div className="text-xs flex gap-4 text-gray-500">
                                            <p>{featuredArticle.stats?.likes || 0} likes</p>
                                            <p>{featuredArticle.stats?.comments || 0} comments</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-gray-400 mb-2">No featured article</div>
                                        <p className="text-xs text-gray-600">Check back soon!</p>
                                    </div>
                                )}
                            </div>

                            {/* Google Ads */}
                            <div className="border-1 border-dashed border-gray-300 rounded-lg h-40 p-4 flex items-center justify-center bg-gray-50">
                                <AdsGoogle slot="7129674925" style={{ display: 'block', width: '100%', height: '100%' }} />
                            </div>

                            {/* Recent Stories */}
                            <div className="bg-white rounded-lg p-5">
                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">Recent Stories</h3>
                                    <p className="text-gray-500 text-sm">Latest community posts</p>
                                </div>

                                <div className="space-y-1">
                                    {recentStories.length > 0 ? (
                                        recentStories.map((story) => (
                                            <Link
                                                key={story.id}
                                                href={`/blogs/${story.slug || story.id}`}
                                                className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="shrink-0 w-1 h-6 bg-blue-500"></div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm truncate mb-1">
                                                        {story.title}
                                                    </h4>
                                                </div>
                                                <div className="text-xs text-gray-400 shrink-0">
                                                    {story.createdAt ? formatTimeAgo(story.createdAt) : 'Now'}
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500 text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-300">
                                    <Link
                                        href="/blogs/recent"
                                        className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        View all recent stories
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>

                            {/* Newsletter */}
                            <NewsletterForm />

                            {/* Upcoming Events */}
                            <div className="bg-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold">Upcoming Events</h3>
                                    <Link href="/events" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                                        View All
                                    </Link>
                                </div>

                                {upcomingEvents.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">No upcoming events</p>
                                        <p className="text-xs text-gray-500 mt-1">Check back soon for new events!</p>
                                    </div>
                                ) : (
                                    upcomingEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.slug || event.id}`}
                                            className="flex group gap-3 mb-4 pb-4 border-b last:border-0 hover:bg-gray-50 p-2 -mx-2 rounded transition-colors"
                                        >
                                            <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                                                {event.coverImage ? (
                                                    <Image
                                                        src={event.coverImage}
                                                        alt={`${event.title} — Event image`}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        priority
                                                        unoptimized
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                                                        <Calendar className="w-6 h-6 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-semibold mb-1 truncate group-hover:text-orange-600 transition-colors">
                                                    {event.title}
                                                </h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatEventDate(event.startDate, event.endDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">
                                                        {event.isOnline ? 'Online Event' :
                                                            `${event.location || 'Location TBD'}`}
                                                    </span>
                                                </div>
                                                {event.isFeatured && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
