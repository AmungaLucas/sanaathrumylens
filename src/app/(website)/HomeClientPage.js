// src/app/(website)/HomeClientPage.jsx (Client Component)
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdsGoogle from '@/components/AdsGoogle';
import { ChevronLeft, ChevronRight, MessageCircle, Eye, Heart, Calendar, MapPin, User, ArrowRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useBlogData } from '@/hooks/useBlogData';
import { useAuth } from '@/contexts/AuthContext';
import HeroCarousel from './_components/HeroCarousel';

// Skeleton Components
const ArticleSkeleton = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        <div className="relative">
            <div className="h-48 bg-linear-to-br from-gray-200 to-gray-400 animate-pulse"></div>
            <div className="absolute top-3 left-3 flex gap-2">
                <div className="bg-gray-300 text-xs px-3 py-1 rounded animate-pulse w-16 h-6"></div>
                <div className="bg-gray-300 text-xs px-3 py-1 rounded animate-pulse w-16 h-6"></div>
            </div>
        </div>
        <div className="p-4">
            <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-300 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded animate-pulse mb-3"></div>
            <div className="h-3 bg-gray-300 rounded animate-pulse w-1/4 mb-4"></div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
                    ))}
                </div>
                <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
        </div>
    </div>
);

const PopularArticleSkeleton = () => (
    <div className="relative h-28 bg-linear-to-br from-gray-300 to-gray-500 rounded-lg overflow-hidden animate-pulse">
        <div className="absolute top-3 left-3 w-16 h-4 bg-gray-400 rounded"></div>
        <div className="absolute bottom-3 left-3 w-3/4 h-4 bg-gray-400 rounded"></div>
    </div>
);

const EventSkeleton = () => (
    <div className="group flex gap-3 mb-4 pb-4 border-b last:border-0">
        <div className="w-16 h-16 bg-linear-to-br from-gray-200 to-gray-400 rounded shrink-0 animate-pulse"></div>
        <div className="flex-1 min-w-0">
            <div className="h-3 bg-gray-300 rounded animate-pulse mb-2 w-full"></div>
            <div className="h-3 bg-gray-300 rounded animate-pulse mb-1 w-2/3"></div>
            <div className="h-3 bg-gray-300 rounded animate-pulse w-1/2"></div>
        </div>
    </div>
);

export default function HomeClientPage({ siteUrl, siteName }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState(null);
    const { isAuthenticated } = useAuth();
    const [likedPosts, setLikedPosts] = useState({});

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(6);

    // Use your blog data hook
    const {
        articles,
        recentStories,
        popularArticles,
        featuredArticle,
        upcomingEvents,
        categories,
        loading,
        error,
        subscribeNewsletter,
        likePost,
        unlikePost,
        checkUserLike,
    } = useBlogData();

    // Memoize current articles to prevent unnecessary re-renders
    const indexOfLastArticle = currentPage * postsPerPage;
    const indexOfFirstArticle = indexOfLastArticle - postsPerPage;
    const currentArticles = useMemo(() =>
        articles.slice(indexOfFirstArticle, indexOfLastArticle),
        [articles, indexOfFirstArticle, indexOfLastArticle]
    );


    // Calculate total pages
    const totalPages = Math.ceil(articles.length / postsPerPage);

    // Helper functions
    const formatTimeAgo = (date) => {
        if (!date) return 'Recently';
        try {
            const dateObj = new Date(date);
            return formatDistanceToNow(dateObj, { addSuffix: true });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Recently';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Date TBD';
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date TBD';
        }
    };

    const formatEventDate = (startDate, endDate) => {
        if (!startDate) return 'Date TBD';

        try {
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : null;

            if (!end || start.toDateString() === end.toDateString()) {
                return formatDate(startDate);
            }

            return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        } catch (error) {
            console.error('Error formatting event date:', error);
            return 'Date TBD';
        }
    };

    // Handle responsive posts per page
    useEffect(() => {
        const handleResize = () => {
            let newPostsPerPage;
            if (window.innerWidth < 640) {
                newPostsPerPage = 4;
            } else if (window.innerWidth < 1024) {
                newPostsPerPage = 6;
            } else {
                newPostsPerPage = 6;
            }

            setPostsPerPage(newPostsPerPage);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch liked status for featured and popular articles only when user changes
    useEffect(() => {
        const fetchInitialLikes = async () => {
            if (!isAuthenticated()) {
                setLikedPosts({});
                return;
            }

            try {
                // Fetch for featured article
                if (featuredArticle?.id) {
                    const isLiked = await checkUserLike(featuredArticle.id);
                    setLikedPosts(prev => ({
                        ...prev,
                        [featuredArticle.id]: isLiked
                    }));
                }

                // Fetch for first 3 popular articles
                const popularToCheck = popularArticles.slice(0, 3);
                for (const article of popularToCheck) {
                    if (article?.id) {
                        const isLiked = await checkUserLike(article.id);
                        setLikedPosts(prev => ({
                            ...prev,
                            [article.id]: isLiked
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching initial likes:', error);
            }
        };

        fetchInitialLikes();
    }, [isAuthenticated, featuredArticle?.id, popularArticles, checkUserLike]);

    // Hero slides
    const heroSlides = [
        {
            title: "Latest from the Creative Ecosystem",
            subtitle: "Connecting master craftspeople with emerging artists to ensure Kenya's creative legacy continues to evolve and inspire."
        }
    ];

    // Handle newsletter subscription
    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setSubscribeStatus({ loading: true, message: '' });

        try {
            const result = await subscribeNewsletter(email);
            setSubscribeStatus({
                loading: false,
                success: result.success,
                message: result.message,
            });

            if (result.success) {
                setEmail('');
                setTimeout(() => setSubscribeStatus(null), 3000);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setSubscribeStatus({
                loading: false,
                success: false,
                message: 'Failed to subscribe. Please try again.',
            });
        }
    };

    // Handle like action - FIXED: Fetch likes on-demand instead of pre-fetching all
    const handleLike = async (postId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated()) {
            alert('Please log in to like posts');
            return;
        }

        // If we don't know the current like status, fetch it first
        if (likedPosts[postId] === undefined) {
            try {
                const isLiked = await checkUserLike(postId);
                setLikedPosts(prev => ({
                    ...prev,
                    [postId]: isLiked
                }));

                // Wait a moment for state to update
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Error fetching like status:', error);
                return;
            }
        }

        const isCurrentlyLiked = likedPosts[postId];

        try {
            if (isCurrentlyLiked) {
                const result = await unlikePost(postId);
                if (result.success) {
                    setLikedPosts(prev => ({
                        ...prev,
                        [postId]: false
                    }));
                }
            } else {
                const result = await likePost(postId);
                if (result.success) {
                    setLikedPosts(prev => ({
                        ...prev,
                        [postId]: true
                    }));
                }
            }
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

    // Pagination handlers
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            document.querySelector('.articles-grid')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            document.querySelector('.articles-grid')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            setCurrentPage(pageNumber);
            document.querySelector('.articles-grid')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Calculate page numbers to display
    const getPageNumbers = () => {
        const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
        const pages = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                start = 2;
                end = Math.min(4, totalPages - 1);
            }

            if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
                end = totalPages - 1;
            }

            if (start > 2) {
                pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    // Hero slide controls
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };



    // Error state
    if (error && !loading) {
        return (
            <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center px-4">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f1e8]">
            {/* Hero Carousel Section */}
            <HeroCarousel />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-wrap gap-6 lg:gap-8">
                    {/* Articles Section */}
                    <div className="flex-1 min-w-75">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold mb-2">Latest from the Creative Ecosystem</h2>
                                <p className="text-gray-600 text-xs sm:text-sm">Explore in-depth profiles, cultural analysis, and visual storytelling from Kenya&apos;s vibrant art scene</p>
                            </div>
                            <Link
                                href="/blogs"
                                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm sm:text-base"
                            >
                                View All Articles
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        {/* Articles Grid */}
                        <div className="articles-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                            {loading ? (
                                Array.from({ length: postsPerPage }).map((_, i) => (
                                    <ArticleSkeleton key={i} />
                                ))
                            ) : currentArticles.length > 0 ? (
                                currentArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        href={`/blogs/${article.slug || article.id}`}
                                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group block"
                                    >
                                        <div className="relative aspect-4/3 overflow-hidden group">
                                            {(article.coverImage || article.featuredImage) ? (
                                                <Image
                                                    src={article.coverImage || article.featuredImage}
                                                    alt={`${article.title} — Featured image`}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    priority={false}
                                                    unoptimized
                                                    sizes="(max-width: 768px) 100vw, 400px"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                                                    <User className="w-12 h-12 text-gray-500" />
                                                </div>
                                            )}

                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <span className="bg-gray-800/80 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
                                                    {article.publishedAt ? formatDate(article.publishedAt) : 'Recent'}
                                                </span>
                                                {article.categoryIds && article.categoryIds[0] && (
                                                    <span className="bg-orange-500/90 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
                                                        {categories?.find(c => c.id === article.categoryIds[0])?.name || 'Uncategorized'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-bold mb-2 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                                                <span dangerouslySetInnerHTML={{ __html: article.excerpt }} />
                                            </p>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle size={14} />
                                                        {article.stats?.comments || 0}
                                                    </span>

                                                    <button
                                                        onClick={(e) => handleLike(article.id, e)}
                                                        className={`flex items-center gap-1 transition-colors ${likedPosts[article.id]
                                                            ? 'text-red-500 hover:text-red-600'
                                                            : 'hover:text-red-500'
                                                            }`}
                                                    >
                                                        <Heart
                                                            size={14}
                                                            className={likedPosts[article.id] ? 'fill-red-500' : ''}
                                                        />
                                                        {article.stats?.likes || 0}
                                                    </button>
                                                </div>
                                                <span className="text-xs text-gray-500 truncate max-w-25">
                                                    {article.authorSnapshot?.name || article.author?.name || 'Anonymous'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <div className="text-gray-400 mb-4">No articles found</div>
                                    <p className="text-gray-600 text-sm">Check back soon for new content!</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {!loading && articles.length > postsPerPage && (
                            <div className="flex justify-between items-center mb-10">
                                <button onClick={prevPage} disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded">
                                    Prev
                                </button>

                                <span className="text-sm text-gray-600 sm:hidden">
                                    {currentPage} / {totalPages}
                                </span>

                                <div className="hidden sm:flex gap-1">
                                    {getPageNumbers().map((p, i) =>
                                        p === '...' ? <span key={i}>...</span> : (
                                            <button
                                                key={p}
                                                onClick={() => goToPage(p)}
                                                className={`w-8 h-8 rounded ${currentPage === p ? 'bg-black text-white' : 'hover:bg-gray-200'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                </div>

                                <button onClick={nextPage} disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded">
                                    Next
                                </button>
                            </div>
                        )}

                        {/* Popular Articles Section */}
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900">
                                        Popular Articles
                                    </h2>
                                    <p className="text-gray-600 text-xs sm:text-sm">
                                        Most read articles from our community
                                    </p>
                                </div>

                                <Link
                                    href="/blogs/popular"
                                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                >
                                    View All Popular
                                </Link>
                            </div>

                            {/* Unified grid for desktop + mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Main Article */}
                                {popularArticles[0] && (
                                    <Link
                                        href={`/blogs/${popularArticles[0].slug || popularArticles[0].id}`}
                                        className="relative h-60 md:h-full rounded-lg overflow-hidden group block"
                                    >
                                        {(popularArticles[0].coverImage || popularArticles[0].featuredImage) ? (
                                            <Image
                                                src={popularArticles[0].coverImage || popularArticles[0].featuredImage}
                                                alt={popularArticles[0].title}
                                                fill
                                                priority
                                                unoptimized
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-linear-to-br from-gray-300 to-gray-600" />
                                        )}

                                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />



                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2">
                                                {popularArticles[0].title}
                                            </h3>
                                            <div
                                                className="mt-1 text-xs text-gray-200 line-clamp-2"
                                                dangerouslySetInnerHTML={{ __html: popularArticles[0].excerpt }}
                                            />
                                        </div>
                                    </Link>
                                )}

                                {/* Other Articles */}
                                <div className="flex flex-col gap-4 h-full">
                                    {popularArticles.slice(1, 3).map((article) => (
                                        <Link
                                            key={article.id}
                                            href={`/blogs/${article.slug || article.id}`}
                                            className="flex gap-3 flex-1 rounded-lg bg-white overflow-hidden group block"
                                        >
                                            {/* Image */}
                                            <div className="relative w-32 h-full shrink-0">
                                                {(article.coverImage || article.featuredImage) ? (
                                                    <Image
                                                        src={article.coverImage || article.featuredImage}
                                                        alt={article.title}
                                                        fill
                                                        unoptimized
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-linear-to-br from-gray-300 to-gray-600" />
                                                )}


                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col justify-between py-2 pr-2 flex-1">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:underline">
                                                        {article.title}
                                                    </h4>
                                                    <div
                                                        className="mt-1 text-xs text-gray-600 line-clamp-2"
                                                        dangerouslySetInnerHTML={{ __html: article.excerpt }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                    <span className="truncate max-w-[110px]">
                                                        {article.authorSnapshot?.name || article.author?.name || 'Anonymous'}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={13} />
                                                            {article.stats?.comments || 0}
                                                        </span>

                                                        <button
                                                            onClick={(e) => handleLike(article.id, e)}
                                                            className={`flex items-center gap-1 transition-colors ${likedPosts[article.id] ? 'text-red-500' : 'hover:text-red-500'
                                                                }`}
                                                        >
                                                            <Heart
                                                                size={13}
                                                                className={likedPosts[article.id] ? 'fill-red-500' : ''}
                                                            />
                                                            {article.stats?.likes || 0}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>



                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* Featured Article */}
                        <div className="bg-white rounded-lg p-4">
                            <h3 className="font-bold mb-4">Featured Article</h3>
                            {loading ? (
                                <div>
                                    <div className="h-32 bg-linear-to-br from-gray-200 to-gray-400 rounded mb-3 animate-pulse"></div>
                                    <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
                                    <div className="h-3 bg-gray-300 rounded animate-pulse w-1/4"></div>
                                </div>
                            ) : featuredArticle ? (
                                <>
                                    <Link
                                        href={`/blogs/${featuredArticle.slug || featuredArticle.id}`}
                                        className="block"
                                    >
                                        <div className="relative h-32 md:h-40 bg-linear-to-br from-gray-200 to-gray-400 rounded mb-3 overflow-hidden group">
                                            {(featuredArticle.coverImage || featuredArticle.featuredImage) && (
                                                <Image
                                                    src={featuredArticle.coverImage || featuredArticle.featuredImage}
                                                    alt={`${featuredArticle.title} — Featured image`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    priority
                                                    sizes="(max-width: 768px) 100vw, 600px"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm mb-2 hover:text-orange-600 transition-colors">{featuredArticle.title}</h4>
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{featuredArticle.excerpt}</p>
                                        <div className="text-xs flex gap-4 text-gray-500">
                                            <p>{featuredArticle.stats?.likes || 0} likes</p>
                                            <p>{featuredArticle.stats?.comments || 0} comments</p>
                                        </div>
                                    </Link>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="text-gray-400 mb-2">No featured article</div>
                                    <p className="text-xs text-gray-600">Check back soon!</p>
                                </div>
                            )}
                        </div>

                        {/* Google Ads */}
                        <div className="border-1 border-dashed border-gray-300 rounded-lg h-40 p-4 flex items-center justify-center bg-gray-50">
                            <AdsGoogle slot="7129674925" style={{ display: 'block', width: '100%', height: '100%', }} />
                        </div>

                        {/* Recent Stories */}
                        <div className="bg-white rounded-lg p-5">
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">Recent Stories</h3>
                                <p className="text-gray-500 text-sm">Latest community posts</p>
                            </div>

                            <div className="space-y-1">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="animate-pulse pl-4">
                                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : recentStories.length > 0 ? (
                                    recentStories.map((story) => (
                                        <Link
                                            key={story.id}
                                            href={`/blogs/${story.slug || story.id}`}
                                            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="shrink-0 w-1 h-6 bg-blue-500"></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm truncate mb-1">
                                                    {story.title}
                                                </h4>

                                            </div>
                                            <div className="text-xs text-gray-400 shrink-0">
                                                {story.createdAt ? formatTimeAgo(story.createdAt) : 'Now'}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-300">
                                <Link
                                    href="/blogs/recent"
                                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    View all recent stories
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="bg-white rounded-lg p-4">
                            <h3 className="font-bold mb-2">Stay on the Lens</h3>
                            <p className="text-xs text-gray-600 mb-4">Get essays, reviews, and creative commentary delivered straight to your inbox—when it matters.</p>

                            <form onSubmit={handleSubscribe}>
                                <input
                                    type="email"
                                    placeholder="Your Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    disabled={subscribeStatus?.loading}
                                >
                                    {subscribeStatus?.loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Subscribing...
                                        </span>
                                    ) : 'Subscribe'}
                                </button>

                                {subscribeStatus && (
                                    <p className={`text-xs mt-2 text-center ${subscribeStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                                        {subscribeStatus.message}
                                    </p>
                                )}

                                <p className="text-xs text-gray-500 mt-2 text-center">By subscribing you agree to our terms and conditions.</p>
                            </form>
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold">Upcoming Events</h3>
                                <Link href="/events" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                                    View All
                                </Link>
                            </div>

                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <EventSkeleton key={i} />
                                ))
                            ) : upcomingEvents.length === 0 ? (
                                <div className="text-center py-4">
                                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">No upcoming events</p>
                                    <p className="text-xs text-gray-500 mt-1">Check back soon for new events!</p>
                                </div>
                            ) : (
                                upcomingEvents.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/events/${event.slug || event.id}`}
                                        className="flex group gap-3 mb-4 pb-4 border-b last:border-0 hover:bg-gray-50 p-2 -mx-2 rounded transition-colors"
                                    >
                                        <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                                            {event.coverImage ? (
                                                <Image
                                                    src={event.coverImage}
                                                    alt={`${event.title} — Event image`}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    priority
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                                                    <Calendar className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-semibold mb-1 truncate group-hover:text-orange-600 transition-colors">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatEventDate(event.startDate, event.endDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">
                                                    {event.isOnline ? 'Online Event' :
                                                        `${event.location?.city || 'Location TBD'}, ${event.location?.country || 'Kenya'}`}
                                                </span>
                                            </div>
                                            {event.featured && (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                                                    Featured
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}