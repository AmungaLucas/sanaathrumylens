// src/app/(website)/blogs/recent/page.js
export const revalidate = 300;

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Eye, Heart, Calendar } from 'lucide-react';
import { query, initDatabase } from '@/lib/db';
import { formatPost } from '@/lib/apiHelper';
import { SITE_NAME, DEFAULT_OG_IMAGE, TWITTER_HANDLE, SITE_URL } from '@/app/seo/constants';

export const metadata = {
    title: `Recent Articles - ${SITE_NAME}`,
    description: `Stay up to date with the latest stories from our creative community on ${SITE_NAME}.`,
    alternates: {
        canonical: `${SITE_URL}/blogs/recent`,
    },
    openGraph: {
        type: 'website',
        title: `Recent Articles - ${SITE_NAME}`,
        description: `Stay up to date with the latest stories from our creative community on ${SITE_NAME}.`,
        url: `${SITE_URL}/blogs/recent`,
        siteName: SITE_NAME,
        images: [
            {
                url: DEFAULT_OG_IMAGE,
                width: 1200,
                height: 630,
                alt: `Recent Articles - ${SITE_NAME}`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `Recent Articles - ${SITE_NAME}`,
        description: `Stay up to date with the latest stories from our creative community on ${SITE_NAME}.`,
        images: [DEFAULT_OG_IMAGE],
        creator: TWITTER_HANDLE,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

function formatTimeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function RecentArticlesPage() {
    const dbOk = await initDatabase();
    if (!dbOk) {
        return (
            <div className="min-h-screen bg-[#f5f1e8] py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <p className="text-gray-600">Service temporarily unavailable. Please try again later.</p>
                    </div>
                </div>
            </div>
        );
    }

    let recentPosts = [];
    try {
        const rows = await query(
            `SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
             FROM posts p
             LEFT JOIN authors a ON p.author_id = a.id
             WHERE p.status = 'published' AND p.is_deleted = 0
             ORDER BY p.published_at DESC LIMIT 20`
        );
        recentPosts = (Array.isArray(rows) ? rows : []).map(formatPost);
    } catch (err) {
        console.error('Error fetching recent articles:', err);
        recentPosts = [];
    }

    return (
        <div className="min-h-screen bg-[#f5f1e8]">
            {/* Hero Section */}
            <div className="bg-linear-to-b from-blue-400 to-blue-600 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-8 h-8 text-white" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Recent Articles</h1>
                    </div>
                    <p className="text-white/90 text-lg max-w-3xl">
                        Stay up to date with the latest stories from our creative community
                    </p>
                    <div className="mt-6 flex gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-white text-sm">📰 Latest content</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Recent Articles List */}
                <div className="space-y-4 mb-12">
                    {recentPosts.map((post, index) => (
                        <Link
                            key={post.id}
                            href={`/blogs/${post.slug || post.id}`}
                            className="flex items-center gap-4 p-4 hover:bg-white rounded-lg transition-colors group bg-white/50"
                        >
                            <div className="text-2xl font-bold text-gray-300 w-8 shrink-0">{index + 1}</div>
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                {(post.coverImage || post.featuredImage) ? (
                                    <Image
                                        src={post.coverImage || post.featuredImage}
                                        alt={`${post.title} — Thumbnail`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium group-hover:text-orange-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {formatTimeAgo(post.publishedAt)}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Eye size={12} />
                                        {post.stats?.views || 0}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Heart size={12} />
                                        {post.stats?.likes || 0}
                                    </span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors shrink-0" />
                        </Link>
                    ))}
                </div>

                {recentPosts.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-lg shadow">
                        <div className="text-gray-400 text-5xl mb-4">📝</div>
                        <h3 className="text-xl font-bold mb-2">No articles yet</h3>
                        <p className="text-gray-600 mb-4">Check back soon for new content</p>
                    </div>
                )}

                {/* Back to Blog */}
                <div className="mt-12 text-center">
                    <Link
                        href="/blogs"
                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                        ← Back to All Articles
                    </Link>
                </div>
            </div>
        </div>
    );
}
