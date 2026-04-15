import { generateBlogMetadata } from "@/app/seo/meta";
import BlogPostClient from "./BlogPostClient";
import { query, initDatabase } from "@/lib/db";
import { formatPost } from "@/lib/apiHelper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

async function fetchPostBySlug(slug) {
    const result = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
         FROM posts p LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.slug = ? AND p.status = 'published' AND p.is_deleted = 0 LIMIT 1`,
        [slug]
    );
    if (!Array.isArray(result) || !result.length) return null;
    return formatPost(result[0]);
}

async function fetchRecentStories(limit = 4) {
    const result = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar
         FROM posts p LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.status = 'published' AND p.is_deleted = 0
         ORDER BY p.published_at DESC LIMIT ?`,
        [limit]
    );
    return (Array.isArray(result) ? result : []).map(formatPost);
}

async function fetchCategories() {
    const result = await query(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY name"
    );
    return Array.isArray(result) ? result : [];
}

async function fetchArticlesByAuthor(authorId, excludePostId, limit = 4) {
    const result = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar
         FROM posts p LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.author_id = ? AND p.status = 'published' AND p.is_deleted = 0 AND p.id != ?
         ORDER BY p.published_at DESC LIMIT ?`,
        [authorId, excludePostId, limit]
    );
    return (Array.isArray(result) ? result : []).map(formatPost);
}

async function fetchRelatedPosts(categoryIds, excludePostId, limit = 4) {
    if (!categoryIds || !categoryIds.length) return [];
    // Simple approach: get recent posts excluding current, then filter client-side
    const result = await query(
        `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar
         FROM posts p LEFT JOIN authors a ON p.author_id = a.id
         WHERE p.status = 'published' AND p.is_deleted = 0 AND p.id != ?
         ORDER BY p.published_at DESC LIMIT 10`,
        [excludePostId]
    );
    const posts = (Array.isArray(result) ? result : []).map(formatPost);
    // Filter by category overlap
    return posts
        .filter(p => {
            if (!p.categoryIds || !p.categoryIds.length) return false;
            return p.categoryIds.some(cid => categoryIds.includes(cid));
        })
        .slice(0, limit);
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    await ensureDb();
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
}

export default async function Page({ params }) {
    const { slug } = await params;
    await ensureDb();

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

    // Fetch related data
    const [recentStories, categories, articlesByAuthor, relatedArticles] = await Promise.all([
        fetchRecentStories(4).then(stories => stories.filter(s => s.id !== post.id).slice(0, 4)),
        fetchCategories(),
        post.author?.id ? fetchArticlesByAuthor(post.author.id, post.id, 4) : Promise.resolve([]),
        fetchRelatedPosts(post.categoryIds || [], post.id, 4),
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
}
