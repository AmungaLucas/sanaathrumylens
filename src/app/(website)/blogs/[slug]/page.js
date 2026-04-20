import { generateBlogMetadata } from "@/app/seo/meta";
import BlogPostClient from "./BlogPostClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

// ISR: Revalidate page every 60 seconds
export const revalidate = 60;

// ── Internal fetch helper ────────────────────────────────────

function getBaseUrl() {
    // Use environment variables only (no headers/cookies to avoid forcing dynamic rendering)
    if (process.env.NEXT_PUBLIC_INTERNAL_URL) return process.env.NEXT_PUBLIC_INTERNAL_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    return 'http://localhost:3000';
}

async function apiFetch(path, options = {}) {
    const base = getBaseUrl();
    const url = `${base}${path}`;
    const { revalidate = 60, ...fetchOptions } = options;
    const res = await fetch(url, { next: { revalidate }, ...fetchOptions });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'API request failed');
    return json.data;
}

// ── Server-side data fetching via API ─────────────────────────────

async function fetchPostBySlug(slug) {
    try {
        const post = await apiFetch(`/api/posts/${slug}`, { revalidate: 60 });
        return post || null;
    } catch { return null; }
}

async function fetchRecentStories(limit = 4) {
    try {
        const data = await apiFetch(`/api/posts?limit=${limit}`, { revalidate: 60 });
        return data.posts || [];
    } catch { return []; }
}

async function fetchCategories() {
    try {
        const data = await apiFetch('/api/categories', { revalidate: 300 });
        return data.categories || [];
    } catch { return []; }
}

async function fetchArticlesByAuthor(authorId, excludePostId, limit = 4) {
    try {
        // API doesn't support author filtering, so fetch a larger set and filter client-side
        const data = await apiFetch('/api/posts?limit=20', { revalidate: 60 });
        const posts = (data.posts || [])
            .filter(p => p.author?.id === authorId && p.id !== excludePostId)
            .slice(0, limit);
        return posts;
    } catch { return []; }
}

async function fetchRelatedPosts(categoryIds, excludePostId, limit = 4) {
    if (!categoryIds || !categoryIds.length) return [];
    try {
        // API doesn't support related posts, so fetch recent and filter by category overlap
        const data = await apiFetch('/api/posts?limit=20', { revalidate: 60 });
        const posts = (data.posts || [])
            .filter(p => {
                if (p.id === excludePostId) return false;
                if (!p.categoryIds || !p.categoryIds.length) return false;
                return p.categoryIds.some(cid => categoryIds.includes(cid));
            })
            .slice(0, limit);
        return posts;
    } catch { return []; }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const post = await fetchPostBySlug(slug);

        if (!post) {
            return {
                title: "Article Not Found",
                description: "The requested article could not be found.",
            };
        }

        return generateBlogMetadata({
            title: post.title,
            excerpt: post.excerpt,
            slug,
            ogImage: post.coverImage || post.featuredImage,
            authorName: post.author?.name,
            publishedDate: post.publishedAt,
        });
    } catch {
        return { title: "Sanaathrumylens", description: "High-quality articles on architecture, design, and technology." };
    }
}

export default async function Page({ params }) {
    const { slug } = await params;

    try {
        const post = await fetchPostBySlug(slug);

        if (!post) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8 bg-base-bg">
                    <div className="text-center max-w-md p-10 bg-surface rounded-2xl border border-base-border shadow-xl">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileQuestion className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-base-fg">Article not found</h1>
                        <p className="text-base-muted mb-8 leading-relaxed">The article you&apos;re looking for doesn&apos;t exist, has been removed, or moved to a new location.</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-surface rounded-full font-bold uppercase tracking-widest text-sm hover:bg-secondary transition-all shadow-md"
                        >
                            <Home size={18} /> Back to Home
                        </Link>
                    </div>
                </div>
            );
        }

        // Fetch related data — each fetch has its own error boundary
        const [recentStories, categories, articlesByAuthor, relatedArticles] = await Promise.all([
            fetchRecentStories(4).then(stories => stories.filter(s => s.id !== post.id).slice(0, 4)).catch(() => []),
            fetchCategories().catch(() => []),
            post.author?.id ? fetchArticlesByAuthor(post.author.id, post.id, 4).catch(() => []) : Promise.resolve([]),
            fetchRelatedPosts(post.categoryIds || [], post.id, 4).catch(() => []),
        ]);

        const initialPostData = {
            post,
            recentStories,
            categories,
            articlesByAuthor,
            relatedArticles,
            viewCount: post.stats?.views || 0,
        };

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Article',
                            headline: post.title,
                            description: post.excerpt,
                            author: {
                                '@type': 'Person',
                                name: post.author?.name || 'Anonymous'
                            },
                            datePublished: post.publishedAt,
                            image: post.coverImage || post.featuredImage,
                        }),
                    }}
                />

                <ErrorBoundary>
                    <BlogPostClient
                        initialPostData={initialPostData}
                        slug={slug}
                    />
                </ErrorBoundary>
            </>
        );
    } catch (error) {
        console.error('Server component error:', error);
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-base-bg">
                <div className="text-center max-w-md p-10 bg-surface rounded-2xl border border-base-border shadow-xl">
                    <h1 className="text-3xl font-bold mb-4 text-base-fg">Something went wrong</h1>
                    <p className="text-base-muted mb-8">We encountered an error loading this article. Please try again.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-surface rounded-full font-bold uppercase tracking-widest text-sm hover:bg-secondary transition-all shadow-md">
                        <Home size={18} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }
}
