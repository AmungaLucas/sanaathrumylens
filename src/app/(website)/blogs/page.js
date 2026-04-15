import { generateBlogListingMetadata } from '@/app/seo/meta';
import { query, initDatabase } from '@/lib/db';
import { formatPost } from '@/lib/apiHelper';
import BlogClient from './BlogClient';
import Link from 'next/link';

async function ensureDb() {
    return await initDatabase();
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

// Helper function to remove duplicates by ID
function removeDuplicatesById(array) {
    const seen = new Set();
    return array.filter(item => {
        if (!item.id) return true;
        if (seen.has(item.id)) {
            return false;
        }
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

        // Fallback: latest post
        const fallback = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.published_at DESC LIMIT 1`
        );
        return Array.isArray(fallback) && fallback.length > 0 ? formatPost(fallback[0]) : null;
    } catch { return null; }
}

// Fetch recent stories
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

// Fetch popular articles
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

// Fetch categories
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

// This function runs on the server
async function getServerSideData(searchParams) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.q || '';
    const category = params.category || '';

    try {
        // Fetch all data in parallel
        const [
            postsData,
            featuredStory,
            recentStories,
            popularArticles,
            categories
        ] = await Promise.all([
            fetchPostsWithFilters(search, category, page, 12),
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

        return {
            posts: postsData.posts,
            featuredStory,
            recentStories: uniqueRecentStories,
            popularArticles: filteredPopularArticles,
            categories,
            hasMore: postsData.hasMore,
            totalPosts: postsData.totalPosts,
            currentPage: page,
            search,
            category,
            totalPages: postsData.totalPages
        };
    } catch (error) {
        console.error('Error fetching server data:', error);
        return {
            posts: [],
            featuredStory: null,
            recentStories: [],
            popularArticles: [],
            categories: [],
            hasMore: false,
            totalPosts: 0,
            currentPage: 1,
            search: '',
            category: '',
            totalPages: 1,
            error: 'Failed to load data'
        };
    }
}

export default async function BlogPage({ searchParams }) {
    const serverData = await getServerSideData(searchParams);

    // Generate canonical URL for current page
    const baseUrl = 'https://www.sanaathrumylens.com/blogs';
    const params = new URLSearchParams();
    if (serverData.currentPage > 1) params.set('page', serverData.currentPage.toString());
    if (serverData.search) params.set('q', serverData.search);
    if (serverData.category) params.set('category', serverData.category);
    const canonicalUrl = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;

    // Generate structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `Blog Articles${serverData.currentPage > 1 ? ` - Page ${serverData.currentPage}` : ''}`,
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
                    "name": `Blog${serverData.currentPage > 1 ? ` - Page ${serverData.currentPage}` : ''}`,
                    "item": canonicalUrl
                }
            ]
        }
    };

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData)
                }}
            />

            {/* Hidden pagination links for SEO (screen readers only) */}
            <div className="sr-only">
                <nav aria-label="Pagination">
                    <h2>Page Navigation</h2>
                    {serverData.currentPage > 1 && (
                        <Link
                            href={`/blogs?page=${serverData.currentPage - 1}`}
                            rel="prev"
                        >
                            Previous Page
                        </Link>
                    )}

                    {Array.from({ length: Math.min(serverData.totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === serverData.currentPage) return null;

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

                    {serverData.hasMore && (
                        <Link
                            href={`/blogs?page=${serverData.currentPage + 1}`}
                            rel="next"
                        >
                            Next Page
                        </Link>
                    )}
                </nav>
            </div>

            <BlogClient
                initialPosts={serverData.posts}
                initialFeaturedStory={serverData.featuredStory}
                initialRecentStories={serverData.recentStories}
                initialPopularArticles={serverData.popularArticles}
                initialCategories={serverData.categories}
                initialPage={serverData.currentPage}
                initialSearch={serverData.search}
                initialCategory={serverData.category}
                initialHasMore={serverData.hasMore}
                initialTotalPosts={serverData.totalPosts}
            />
        </>
    );
}
