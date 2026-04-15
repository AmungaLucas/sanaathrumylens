'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '@/app/seo/constants';
import AdsGoogle from '@/components/AdsGoogle';

export default function AuthorProfileClient({ slug }) {
    const [author, setAuthor] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuthorAndPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch author + posts from API
                const res = await fetch(`/api/authors/${slug}`);
                const json = await res.json();

                let authorData = null;
                let authorPosts = [];

                if (json.success && json.data) {
                    authorData = json.data.author;
                    authorPosts = json.data.posts || [];
                }

                // If no author found in API, create a basic author object
                if (!authorData) {
                    authorData = {
                        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        slug: slug,
                        bio: ''
                    };
                }

                setAuthor(authorData);
                setPosts(authorPosts);

            } catch (err) {
                console.error('Error fetching author:', err);
                setError(err.message || 'Failed to load author profile');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchAuthorAndPosts();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-3">Loading author profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="text-center p-8">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Error Loading Author</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/blogs"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
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
