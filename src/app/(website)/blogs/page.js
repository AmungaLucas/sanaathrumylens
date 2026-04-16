import { generateBlogListingMetadata } from '@/app/seo/meta';
import { query, initDatabase } from '@/lib/db';
import { formatPost } from '@/lib/apiHelper';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import BlogSearchFilter from './_components/BlogSearchFilter';
import NewsletterForm from '../_components/NewsletterForm';
import AdsGoogle from '@/components/AdsGoogle';

async function ensureDb() {
    return await initDatabase();
}

// Helper function to remove duplicates by ID
function removeDuplicatesById(array) {
    const seen = new Set();
    return array.filter(item => {
        if (!item.id) return true;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

// Helper to fetch posts with filters
async function fetchPostsWithFilters(search = '', category = '', page = 1, limit = 12) {
    try {
        await ensureDb();

        const conditions = ["p.status = 'published'", 'p.is_deleted = 0'];
        const values = [];

        if (search) {
            conditions.push('(p.title LIKE ? OR p.excerpt LIKE ?)');
            const term = `%${search}%`;
            values.push(term, term);
        }

        if (category) {
            conditions.push('p.category_ids LIKE ?');
            values.push(`%"${category}"%`);
        }

        const where = conditions.join(' AND ');

        // Count total
        const countRows = await query(`SELECT COUNT(*) as total FROM posts p WHERE ${where}`, values);
        const totalPosts = Array.isArray(countRows) && countRows[0] ? countRows[0].total : 0;

        // Fetch paginated posts
        const offset = (page - 1) * limit;
        const postRows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE ${where}
             ORDER BY p.published_at DESC
             LIMIT ? OFFSET ?`,
            [...values, limit, offset]
        );

        const posts = Array.isArray(postRows) ? postRows.map(formatPost) : [];

        return {
            posts,
            hasMore: totalPosts > offset + limit,
            totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit)
        };
    } catch (error) {
        console.error('Error fetching posts with filters:', error);
        throw error;
    }
}

// Fetch a featured article
async function fetchFeaturedArticle() {
    try {
        await ensureDb();
        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0 AND p.is_featured = 1
             ORDER BY p.published_at DESC LIMIT 1`
        );
        if (Array.isArray(rows) && rows.length > 0) return formatPost(rows[0]);

        const fallback = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.published_at DESC LIMIT 1`
        );
        return Array.isArray(fallback) && fallback.length > 0 ? formatPost(fallback[0]) : null;
    } catch { return null; }
}

async function fetchRecentStories(count = 4) {
    try {
        await ensureDb();
        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.published_at DESC LIMIT ?`,
            [count]
        );
        return Array.isArray(rows) ? rows.map(formatPost) : [];
    } catch { return []; }
}

async function fetchPopularArticles(count = 4) {
    try {
        await ensureDb();
        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.stats_views DESC LIMIT ?`,
            [count]
        );
        return Array.isArray(rows) ? rows.map(formatPost) : [];
    } catch { return []; }
}

async function fetchCategories() {
    try {
        await ensureDb();
        const rows = await query(
            `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_ids LIKE CONCAT('%"', c.slug, '"%') AND p.status = 'published' AND p.is_deleted = 0) as post_count
             FROM categories c WHERE c.is_active = 1
             ORDER BY c.name ASC`
        );
        return Array.isArray(rows) ? rows.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            postCount: r.post_count || 0,
        })) : [];
    } catch { return []; }
}

function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.q || '';
    const category = params.category || '';

    return generateBlogListingMetadata({
        page,
        search,
        category
    });
}

export default async function BlogPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.q || '';
    const category = params.category || '';

    // Fetch all data in parallel
    const [
        postsData,
        featuredStory,
        recentStories,
        popularArticles,
        categories
    ] = await Promise.all([
        fetchPostsWithFilters(search, category, page, 12).catch(() => ({
            posts: [], hasMore: false, totalPosts: 0, currentPage: 1, totalPages: 1
        })),
        fetchFeaturedArticle(),
        fetchRecentStories(4),
        fetchPopularArticles(4),
        fetchCategories()
    ]);

    // Remove duplicates from sidebar content
    const uniqueRecentStories = removeDuplicatesById(recentStories);
    const uniquePopularArticles = removeDuplicatesById(popularArticles);

    // Ensure popular articles don't overlap with recent stories
    const recentStoryIds = new Set(uniqueRecentStories.map(story => story.id));
    const filteredPopularArticles = uniquePopularArticles.filter(article =>
        !recentStoryIds.has(article.id)
    );

    // Generate canonical URL
    const baseUrl = 'https://www.sanaathrumylens.com/blogs';
    const urlParams = new URLSearchParams();
    if (page > 1) urlParams.set('page', page.toString());
    if (search) urlParams.set('q', search);
    if (category) urlParams.set('category', category);
    const canonicalUrl = `${baseUrl}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

    // Generate structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `Blog Articles${page > 1 ? ` - Page ${page}` : ''}`,
        "description": "Browse our collection of articles on architecture, design, and technology",
        "url": canonicalUrl,
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.sanaathrumylens.com"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": `Blog${page > 1 ? ` - Page ${page}` : ''}`,
                    "item": canonicalUrl
                }
            ]
        }
    };

    const posts = postsData.posts;
    const hasMore = postsData.hasMore;
    const totalPages = postsData.totalPages;

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Main Content */}
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-7xl mx-auto px-2 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Content Area - 3 columns */}
                        <div className="lg:col-span-3 space-y-8">
                            {/* Search and filter - Client component */}
                            <BlogSearchFilter
                                initialSearch={search}
                                initialCategory={category}
                                categories={categories}
                            />

                            {/* Info bar */}
                            <div className="flex items-center justify-between p-1">
                                <span className="text-xs sm:text-sm text-gray-500">
                                    {search || category ? (
                                        `Showing ${posts.length} results`
                                    ) : (
                                        `Page ${page} of ${totalPages || 1} &bull; ${postsData.totalPosts} articles`
                                    )}
                                </span>
                                {(search || category) && (
                                    <Link
                                        href="/blogs"
                                        className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                                    >
                                        Clear filters
                                    </Link>
                                )}
                            </div>

                            {/* Articles Grid */}
                            {posts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {posts.map((post) => (
                                        <div
                                            key={`${post.id}-${post.publishedAt || ''}`}
                                            className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                        >
                                            <Link
                                                href={`/blogs/${post.slug || post.id}`}
                                                className="block"
                                            >
                                                <div className="relative aspect-video">
                                                    {(post.coverImage || post.featuredImage) ? (
                                                        <Image
                                                            src={post.coverImage || post.featuredImage}
                                                            alt={`${post.title} — Featured image`}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                            <div className="text-gray-400">
                                                                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                                                                <p className="text-xs">No image</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3">
                                                        {post.category && (
                                                            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                                                                {post.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className="p-4">
                                                <div className="mb-3">
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(post.publishedAt)}
                                                    </span>
                                                </div>

                                                <Link href={`/blogs/${post.slug || post.id}`}>
                                                    <h3 className="font-bold hover:text-orange-500 transition-colors mb-2 line-clamp-2">
                                                        {post.title}
                                                    </h3>
                                                </Link>

                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                    {post.excerpt}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} />
                                                            {post.authorSnapshot?.name || post.author || 'Anonymous'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Heart size={12} />
                                                            {post.stats?.likes || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={12} />
                                                            {post.stats?.comments || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-lg shadow">
                                    <div className="text-gray-400 text-5xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold mb-2">No articles found</h3>
                                    <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                                    <Link
                                        href="/blogs"
                                        className="text-orange-500 hover:text-orange-600 font-medium"
                                    >
                                        Clear filters
                                    </Link>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
                                    {page > 1 && (
                                        <Link
                                            href={page === 2 ? '/blogs' : `/blogs?page=${page - 1}${search ? `&q=${search}` : ''}${category ? `&category=${category}` : ''}`}
                                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium transition-colors"
                                            rel="prev"
                                        >
                                            ← Previous
                                        </Link>
                                    )}

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => {
                                            // Show first, last, current, and neighbors
                                            return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                                        })
                                        .reduce((acc, p, idx, arr) => {
                                            // Add ellipsis between gaps
                                            if (idx > 0 && p - arr[idx - 1] > 1) {
                                                acc.push(<span key={`ellipsis-${p}`} className="px-2 text-gray-400">...</span>);
                                            }
                                            acc.push(
                                                <Link
                                                    key={p}
                                                    href={p === 1 ? `/blogs${search ? `?q=${search}` : ''}${category ? `${search ? '&' : '?'}category=${category}` : ''}` : `/blogs?page=${p}${search ? `&q=${search}` : ''}${category ? `&category=${category}` : ''}`}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${p === page
                                                        ? 'bg-orange-500 text-white'
                                                        : 'border border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                    aria-current={p === page ? 'page' : undefined}
                                                >
                                                    {p}
                                                </Link>
                                            );
                                            return acc;
                                        }, [])}

                                    {hasMore && page < totalPages && (
                                        <Link
                                            href={`/blogs?page=${page + 1}${search ? `&q=${search}` : ''}${category ? `&category=${category}` : ''}`}
                                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium transition-colors"
                                            rel="next"
                                        >
                                            Next →
                                        </Link>
                                    )}
                                </nav>
                            )}

                            {/* Hidden pagination links for SEO (screen readers only) */}
                            <div className="sr-only">
                                <nav aria-label="Page Navigation">
                                    <h2>Page Navigation</h2>
                                    {page > 1 && (
                                        <Link
                                            href={`/blogs?page=${page - 1}`}
                                            rel="prev"
                                        >
                                            Previous Page
                                        </Link>
                                    )}
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const pageNum = i + 1;
                                        if (pageNum === page) return null;
                                        return (
                                            <Link
                                                key={pageNum}
                                                href={`/blogs?page=${pageNum}`}
                                                aria-label={`Go to page ${pageNum}`}
                                            >
                                                Page {pageNum}
                                            </Link>
                                        );
                                    }).filter(Boolean)}
                                    {hasMore && (
                                        <Link
                                            href={`/blogs?page=${page + 1}`}
                                            rel="next"
                                        >
                                            Next Page
                                        </Link>
                                    )}
                                </nav>
                            </div>
                        </div>

                        {/* Right Sidebar - 1 column */}
                        <div className="space-y-6">
                            {/* Featured Story */}
                            <div className="bg-white rounded-lg shadow p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-orange-500 rounded"></div>
                                    Featured Story
                                </h3>
                                {featuredStory ? (
                                    <>
                                        <Link href={`/blogs/${featuredStory.slug || featuredStory.id}`} className="block">
                                            <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                                                {featuredStory.featuredImage ? (
                                                    <Image
                                                        src={featuredStory.featuredImage}
                                                        alt={`${featuredStory.title} — Featured image`}
                                                        fill
                                                        className="object-cover hover:scale-105 transition-transform duration-300"
                                                        sizes="320px"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <h4 className="font-bold text-sm mb-2 line-clamp-2 hover:text-orange-500">
                                            <Link href={`/blogs/${featuredStory.slug || featuredStory.id}`}>
                                                {featuredStory.title}
                                            </Link>
                                        </h4>
                                        <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                                            {featuredStory.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{formatDate(featuredStory.publishedAt)}</span>
                                        </div>
                                        <Link
                                            href={`/blogs/${featuredStory.slug || featuredStory.id}`}
                                            className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-3 inline-flex items-center gap-1"
                                        >
                                            Read Full Story
                                            <ArrowRight size={14} />
                                        </Link>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No featured story available</p>
                                )}
                            </div>

                            {/* Recent Stories */}
                            <div className="bg-white rounded-lg shadow p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-blue-500 rounded"></div>
                                    Recent Stories
                                </h3>
                                {uniqueRecentStories.length > 0 ? (
                                    <div className="space-y-4">
                                        {uniqueRecentStories.map((story, idx) => (
                                            <div key={story.id || idx} className="pb-4 border-b last:border-0 last:pb-0">
                                                <div className="flex gap-3">
                                                    <Link href={`/blogs/${story.slug || story.id}`} className="shrink-0">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                                            {story.featuredImage && (
                                                                <Image
                                                                    src={story.featuredImage}
                                                                    alt={`${story.title} — Thumbnail`}
                                                                    width={64}
                                                                    height={64}
                                                                    className="w-full h-full object-cover"
                                                                    unoptimized
                                                                />
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold mb-1 line-clamp-2 hover:text-orange-500">
                                                            <Link href={`/blogs/${story.slug || story.id}`}>
                                                                {story.title}
                                                            </Link>
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {formatDate(story.publishedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No recent stories</p>
                                )}
                            </div>

                            {/* Popular Articles */}
                            <div className="bg-white rounded-lg shadow p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-red-500 rounded"></div>
                                    Popular Articles
                                </h3>
                                {filteredPopularArticles.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredPopularArticles.map((article, idx) => (
                                            <div key={article.id || idx} className="pb-3 border-b last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-gray-400">#{idx + 1}</span>
                                                    <div className="flex-1">
                                                        <Link href={`/blogs/${article.slug || article.id}`}>
                                                            <span className="text-sm font-semibold text-gray-800 hover:text-orange-500 line-clamp-1">
                                                                {article.title}
                                                            </span>
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(article.publishedAt)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {article.stats?.views || 0} views
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No popular articles</p>
                                )}
                            </div>

                            {/* Google Ads */}
                            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50 min-h-60">
                                <AdsGoogle slot="7129674925" style={{ display: 'block', width: '100%', height: '100%' }} />
                            </div>

                            {/* Newsletter */}
                            <NewsletterForm />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
