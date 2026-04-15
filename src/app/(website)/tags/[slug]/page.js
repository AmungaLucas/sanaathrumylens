import { query, initDatabase } from '@/lib/db';
import { formatPost } from '@/lib/apiHelper';
import { generateTagMetadata } from '@/app/seo/meta';
import Link from 'next/link';
import Image from 'next/image';

let dbReady = false;
async function ensureDb() {
    if (!dbReady) {
        await initDatabase();
        dbReady = true;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    return generateTagMetadata(slug);
}

export default async function TagPage({ params }) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    let articles = [];
    let error = null;

    try {
        await ensureDb();

        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar
             FROM posts p LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             AND (p.tags LIKE ?)
             ORDER BY p.published_at DESC`,
            [`%"${decodedSlug}"%`]
        );

        articles = Array.isArray(rows) ? rows.map(formatPost) : [];
    } catch (err) {
        console.error('Error fetching articles by tag:', err);
        error = err.message;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <p className="text-lg text-red-600 dark:text-red-400">Error loading articles: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Tag header */}
            <div className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        #{decodedSlug}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {articles.length} article{articles.length !== 1 ? 's' : ''} tagged with this topic
                    </p>
                </div>
            </div>

            {/* Articles with tag */}
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {articles.length > 0 ? (
                        <div className="space-y-6">
                            {articles.map((article) => (
                                <article key={article.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex gap-4">
                                        {(article.coverImage || article.featuredImage) && (
                                            <div className="flex-shrink-0 w-24 h-24">
                                                <Image
                                                    src={article.coverImage || article.featuredImage}
                                                    alt={`${article.title} — Thumbnail`}
                                                    width={96}
                                                    height={96}
                                                    className="w-full h-full object-cover rounded"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Link href={`/blogs/${article.slug}`} className="block">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                                                    {article.title}
                                                </h3>
                                            </Link>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                                {article.excerpt || article.description}
                                            </p>
                                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                                <time dateTime={article.publishedAt}>
                                                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}
                                                </time>
                                                {article.author?.name && (
                                                    <Link href={`/author/${article.author.slug || article.author.name?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600">
                                                        By {article.author.name}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                No articles found with this tag.
                            </p>
                            <Link href="/blogs" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                                Back to all articles
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
