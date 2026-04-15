// src/app/(website)/blogs/recent/page.js
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Eye, Heart, Calendar } from 'lucide-react';

export default function RecentArticlesPage() {
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecentArticles();
    }, []);

    const fetchRecentArticles = async () => {
        try {
            setLoading(true);

            const res = await fetch('/api/posts?limit=20&sort=publishedAt&sortDir=desc');
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load recent articles');
            }

            setRecentPosts(data.data || []);
        } catch (err) {
            console.error('Error fetching recent articles:', err);
            setError('Failed to load recent articles');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const dateObj = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return formatDate(date);
    };

    if (loading && recentPosts.length === 0) {
        return (
            <div className="min-h-screen bg-[#f5f1e8] py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading recent articles...</p>
                    </div>
                </div>
            </div>
        );
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

                {recentPosts.length === 0 && !loading && (
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
