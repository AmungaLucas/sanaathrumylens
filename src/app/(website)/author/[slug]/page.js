import { query, initDatabase } from '@/lib/db';
import { formatPost } from '@/lib/apiHelper';
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '@/app/seo/constants';
import { generateCanonicalUrl } from '@/app/seo/meta';
import Image from 'next/image';
import Link from 'next/link';
import AdsGoogle from '@/components/AdsGoogle';

async function ensureDb() {
    return await initDatabase();
}

// SEO: generateMetadata for author profile (Server Component)
export async function generateMetadata({ params }) {
    const { slug } = await params;

    let authorName = slug;
    let authorBio = '';
    let authorImage = DEFAULT_OG_IMAGE;

    const dbOk = await ensureDb();
    if (!dbOk) {
        return {
            title: SITE_NAME,
            description: 'Service temporarily unavailable.',
        };
    }

    try {
        const rows = await query('SELECT * FROM authors WHERE slug = ? LIMIT 1', [slug]);

        if (Array.isArray(rows) && rows.length > 0) {
            const data = rows[0];
            authorName = data.name || slug;
            authorBio = data.bio || '';
            authorImage = data.avatar || DEFAULT_OG_IMAGE;
        }
    } catch (e) {
        console.error('Error fetching author for SEO:', e);
    }

    const canonicalUrl = generateCanonicalUrl(`author/${slug}`);
    const title = `${authorName} - Author at ${SITE_NAME}`;
    const description = authorBio || `Read articles by ${authorName} on ${SITE_NAME}.`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: 'profile',
            title,
            description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            images: [
                {
                    url: authorImage,
                    width: 400,
                    height: 400,
                    alt: authorName,
                },
            ],
            profile: {
                firstName: authorName.split(' ')[0],
                lastName: authorName.split(' ').slice(1).join(' '),
            },
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [authorImage],
        },
        robots: {
            index: true,
            follow: true,
        }
    };
}

export default async function AuthorPage({ params }) {
    const { slug } = await params;

    const dbOk = await ensureDb();
    if (!dbOk) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#f5f1e8]">
                <div className="text-center">
                    <p className="text-gray-500">Service temporarily unavailable. Please try again later.</p>
                </div>
            </div>
        );
    }

    // Fetch author
    let author = null;
    try {
        const authorRows = await query('SELECT * FROM authors WHERE slug = ? LIMIT 1', [slug]);
        if (Array.isArray(authorRows) && authorRows.length > 0) {
            author = authorRows[0];
        }
    } catch (e) {
        console.error('Error fetching author:', e);
    }

    // If no author found, create a basic author object from slug
    if (!author) {
        author = {
            name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            slug: slug,
            bio: '',
            avatar: null,
            twitter: null,
            website: null,
        };
    }

    // Fetch author's posts
    let posts = [];
    try {
        const postRows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p
             LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.author_id = ? AND p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.published_at DESC LIMIT 20`,
            [author.id || slug]
        );
        posts = (Array.isArray(postRows) ? postRows : []).map(formatPost);
    } catch (e) {
        console.error('Error fetching author posts:', e);
        posts = [];
    }

    return (
        <>
            {/* SEO: JSON-LD Person & Breadcrumb schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: author?.name,
                        description: author?.bio,
                        image: author?.avatar,
                        url: `${SITE_URL}/author/${author?.slug}`,
                    })
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        'itemListElement': [
                            {
                                '@type': 'ListItem',
                                position: 1,
                                name: SITE_NAME,
                                item: SITE_URL
                            },
                            {
                                '@type': 'ListItem',
                                position: 2,
                                name: 'Authors',
                                item: `${SITE_URL}/author`
                            },
                            {
                                '@type': 'ListItem',
                                position: 3,
                                name: author?.name,
                                item: `${SITE_URL}/author/${author?.slug}`
                            }
                        ]
                    })
                }}
            />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                {/* Google AdSense Ad in sidebar */}
                <div style={{ margin: '0 0 24px 0', display: 'flex', justifyContent: 'center' }}>
                    <AdsGoogle slot="7129674925" style={{ display: 'block', minHeight: 250, minWidth: 200, width: '100%' }} />
                </div>
                {/* Author header */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                        <div className="flex-1 min-w-0">
                            {/* Author name, bio, and image */}
                            <div className="flex items-center mb-4">
                                <div className="shrink-0 mr-4">
                                    <Image
                                        src={author?.avatar || DEFAULT_OG_IMAGE}
                                        alt={author?.name}
                                        width={80}
                                        height={80}
                                        className="rounded-full"
                                        unoptimized
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-3xl font-extrabold leading-tight mb-1">
                                        {author?.name}
                                    </h1>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                        {author?.bio}
                                    </div>
                                    {/* Social links (if any) */}
                                    <div className="flex space-x-4 text-gray-600 dark:text-gray-300 text-sm">
                                        {author?.twitter && (
                                            <Link href={author.twitter} target="_blank" rel="noopener noreferrer">
                                                Twitter
                                            </Link>
                                        )}
                                        {author?.website && (
                                            <Link href={author.website} target="_blank" rel="noopener noreferrer">
                                                Website
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Author posts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.length === 0 && (
                            <div className="col-span-full text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No posts found by this author.
                                </p>
                            </div>
                        )}
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                                <Link href={`/blogs/${post.slug || post.id}`} className="block group">
                                    <div className="relative pb-2/3">
                                        <Image
                                            src={post.coverImage || post.featuredImage}
                                            alt={post.title}
                                            fill
                                            className="absolute inset-0 w-full h-full object-cover rounded-t-lg group-hover:scale-105 transition-transform"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                            {post.title}
                                        </h2>
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</span>
                                            <span>&bull;</span>
                                            <span>{post.readingTime} min read</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
