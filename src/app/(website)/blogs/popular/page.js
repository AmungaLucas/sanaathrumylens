// src/app/(website)/blogs/popular/page.js
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ArrowRight, Flame, Heart } from 'lucide-react';

export default function PopularArticlesPage() {
    const [popularPosts, setPopularPosts] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPopularArticles();
    }, []);

    const fetchPopularArticles = async () => {
        try {
            setLoading(true);

            const res = await fetch('/api/posts?limit=20&sort=stats_views&sortDir=desc');
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load popular articles');
            }

            const posts = data.data || [];

            // Sort by combined popularity score (views + likes)
            const sortedPosts = [...posts].sort((a, b) => {
                const scoreA = (a.stats?.views || 0) + (a.stats?.likes || 0);
                const scoreB = (b.stats?.views || 0) + (b.stats?.likes || 0);
                return scoreB - scoreA;
            });

            setPopularPosts(sortedPosts.slice(0, 6));
            setTrendingPosts(sortedPosts.slice(0, 10));

        } catch (err) {
            console.error('Error fetching popular articles:', err);
            setError('Failed to load popular articles');
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

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    if (loading && popularPosts.length === 0) {
        return (
            <div className="min-h-screen bg-[#f5f1e8] py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading popular articles...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f1e8]">
            {/* Hero Section */}
            <div className="bg-linear-to-b from-orange-400 to-orange-600 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Flame className="w-8 h-8 text-white" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Popular Articles</h1>
                    </div>
                    <p className="text-white/90 text-lg max-w-3xl">
                        Discover the most read, shared, and loved content from our creative community
                    </p>
                    <div className="mt-6 flex gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-white text-sm">🔥 Trending this week</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Top Articles Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {popularPosts.slice(0, 2).map((post, index) => (
                        <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-lg">
                            <Link href={`/blogs/${post.slug || post.id}`} className="block">
                                <div className="relative aspect-video overflow-hidden">
                                    {(post.coverImage || post.featuredImage) ? (
                                        <Image
                                            src={post.coverImage || post.featuredImage}
                                            alt={`${post.title} — Featured image`}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority={index === 0}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400"></div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                                            #{index + 1} Most Popular
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                                            <h2 className="text-white text-xl font-bold mb-2 line-clamp-2">
                                                {post.title}
                                            </h2>
                                            <div className="flex items-center gap-4 text-white/80 text-sm">
                                                <span>{formatDate(post.publishedAt)}</span>
                                                <span>•</span>
                                                <span>{formatNumber(post.stats?.views || 0)} views</span>
                                                <span>•</span>
                                                <span>{formatNumber(post.stats?.likes || 0)} likes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Trending List */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Flame className="w-6 h-6 text-orange-500" />
                        Trending Now
                    </h2>
                    <div className="space-y-4">
                        {trendingPosts.map((post, index) => (
                            <Link
                                key={post.id}
                                href={`/blogs/${post.slug || post.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <div className="text-2xl font-bold text-gray-300 w-8">{index + 1}</div>
                                <div className="flex-1">
                                    <h3 className="font-medium group-hover:text-orange-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span>{formatDate(post.publishedAt)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Eye size={12} />
                                            {formatNumber(post.stats?.views || 0)}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Heart size={12} />
                                            {formatNumber(post.stats?.likes || 0)}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* More Popular Articles */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">More Popular Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularPosts.slice(2).map((post) => (
                            <article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <Link href={`/blogs/${post.slug || post.id}`} className="block">
                                    <div className="relative aspect-video overflow-hidden">
                                        {(post.coverImage || post.featuredImage) ? (
                                            <Image
                                                src={post.coverImage || post.featuredImage}
                                                alt={`${post.title} — Featured image`}
                                                fill
                                                className="object-cover hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400"></div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{formatDate(post.publishedAt)}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Eye size={12} />
                                                    {post.stats?.views || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart size={12} />
                                                    {post.stats?.likes || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>

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
