"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar, User, Eye, MessageCircle, Heart, ArrowRight,
    Grid, List, Search, Facebook, Share2, Loader, ChevronRight, ChevronLeft
} from 'lucide-react';
import AdsGoogle from '@/components/AdsGoogle';

// Skeleton Loader Components
const PostCardSkeleton = ({ viewMode = 'grid' }) => (
    <div className={`bg-white rounded-lg overflow-hidden ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}>
        <div className={`relative ${viewMode === 'list' ? 'w-48 h-32 shrink-0' : 'aspect-video'}`}>
            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        </div>
        <div className={viewMode === 'list' ? 'flex-1 space-y-3' : 'p-4 space-y-3'}>
            <div className="flex items-center gap-2">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-5/6 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>
    </div>
);

const FeaturedStorySkeleton = () => (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="aspect-video rounded-lg bg-gray-200 animate-pulse"></div>
        <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center justify-between">
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
    </div>
);

const RecentStorySkeleton = () => (
    <div className="pb-4 border-b last:border-0 last:pb-0">
        <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse"></div>
            <div className="flex-1 space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>
    </div>
);

const PopularArticleSkeleton = () => (
    <div className="pb-3 border-b last:border-0 last:pb-0">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
    </div>
);

const CategorySkeleton = () => (
    <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
        ))}
    </div>
);

export default function BlogClient({
    initialPosts = [],
    initialFeaturedStory = null,
    initialRecentStories = [],
    initialPopularArticles = [],
    initialCategories = [],
    initialPage = 1,
    initialSearch = '',
    initialCategory = '',
    initialHasMore = true,
    initialTotalPosts = 0
}) {
    const [posts, setPosts] = useState(initialPosts);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [email, setEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);

    // Track the last page that was actually loaded
    const [loadedPages, setLoadedPages] = useState(new Set([initialPage]));

    const postsPerPage = 12;
    const totalPages = Math.ceil(initialTotalPosts / postsPerPage);

    // Helper to convert serialized date strings back to Date objects
    const parseDate = (dateInput) => {
        if (!dateInput) return null;
        if (dateInput instanceof Date) return dateInput;
        if (typeof dateInput === 'string') {
            try {
                return new Date(dateInput);
            } catch (error) {
                console.error('Error parsing date string:', error);
                return null;
            }
        }
        return null;
    };

    const formatDate = (dateInput) => {
        const date = parseDate(dateInput);
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Fetch more posts for "Load More" functionality
    const fetchMorePosts = useCallback(async () => {
        if (!hasMore || loadingMore) return;

        const nextPage = currentPage + 1;

        // Don't load if we've already loaded this page
        if (loadedPages.has(nextPage)) {
            console.log(`Page ${nextPage} already loaded, skipping`);
            return;
        }

        try {
            setLoadingMore(true);
            console.log(`Loading page ${nextPage}...`);

            // Build query params for API
            const params = new URLSearchParams();
            params.set('limit', String(postsPerPage * nextPage));
            params.set('sort', 'publishedAt');
            params.set('sortDir', 'desc');
            if (searchQuery) params.set('search', searchQuery);
            if (selectedCategory) params.set('category', selectedCategory);

            const res = await fetch(`/api/posts?${params.toString()}`);
            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Failed to load more posts');
                setLoadingMore(false);
                return;
            }

            const allPosts = data.data?.posts || [];

            if (allPosts.length === 0) {
                setHasMore(false);
                setLoadingMore(false);
                return;
            }

            // Calculate the posts for the specific page we're loading
            const startIndex = postsPerPage * (nextPage - 1);
            const endIndex = postsPerPage * nextPage;
            const pagePosts = allPosts.slice(startIndex, endIndex);

            console.log(`Page ${nextPage}: ${pagePosts.length} posts (${startIndex}-${endIndex})`);

            // Add the new page's posts
            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPosts = pagePosts.filter(post => !existingIds.has(post.id));
                return [...prev, ...uniqueNewPosts];
            });

            // Mark this page as loaded
            setLoadedPages(prev => new Set([...prev, nextPage]));

            // Update state
            setCurrentPage(nextPage);
            setHasMore(endIndex < (data.data?.pagination?.total || allPosts.length));

            // Update URL to reflect the new page
            const urlParams = new URLSearchParams(searchParams.toString());
            if (nextPage > 1) {
                urlParams.set('page', nextPage.toString());
            } else {
                urlParams.delete('page');
            }

            // Use router.replace instead of pushState for better Next.js integration
            router.replace(`/blogs?${urlParams.toString()}`, { scroll: false });

        } catch (err) {
            console.error('Error fetching more posts:', err);
            setError('Failed to load more posts');
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, searchQuery, selectedCategory, postsPerPage, searchParams, currentPage, loadedPages, router]);

    // Handle search and category changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== initialSearch || selectedCategory !== initialCategory) {
                setIsFiltering(true);
                setCurrentPage(1);
                setHasMore(true);
                setPosts([]);
                setLoadedPages(new Set([1])); // Reset loaded pages

                // Update URL with filters
                const params = new URLSearchParams();
                if (searchQuery) params.set('q', searchQuery);
                if (selectedCategory) params.set('category', selectedCategory);
                params.delete('page'); // Reset to page 1

                const queryString = params.toString();
                router.push(`/blogs${queryString ? `?${queryString}` : ''}`, { scroll: false });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, router, initialSearch, initialCategory]);

    // Handle clear filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setCurrentPage(1);
        setPosts(initialPosts);
        setLoadedPages(new Set([1])); // Reset loaded pages
        router.push('/blogs', { scroll: false });
    };

    const handleNewsletterSubscribe = async () => {
        if (!email || !email.includes('@')) {
            setNewsletterMessage('Please enter a valid email address');
            return;
        }

        try {
            setNewsletterLoading(true);
            const res = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            setNewsletterMessage(result.message);
            if (result.success) {
                setEmail('');
            }
        } catch (error) {
            setNewsletterMessage('Subscription failed. Please try again.');
        } finally {
            setNewsletterLoading(false);
        }
    };

    // Generate page numbers for SEO-friendly hidden pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    // Handle direct page navigation (for numbered links)
    const goToPage = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;

        const params = new URLSearchParams(searchParams.toString());
        if (pageNumber > 1) {
            params.set('page', pageNumber.toString());
        } else {
            params.delete('page');
        }

        router.push(`/blogs?${params.toString()}`, { scroll: false });
    };

    // Prepare structured data
    const structuredDataScript = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `Blog Articles${currentPage > 1 ? ` - Page ${currentPage}` : ''}`,
        "description": "Latest articles on architecture, design, and technology",
        "url": `https://www.sanaathrumylens.com/blogs?page=${currentPage}`,
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": posts.length,
            "itemListElement": posts.slice(0, 10).map((post, index) => {
                let datePublished = new Date().toISOString();
                if (post.publishedAt) {
                    const date = parseDate(post.publishedAt);
                    if (date) {
                        datePublished = date.toISOString();
                    }
                }

                return {
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                        "@type": "Article",
                        "headline": post.title || "Untitled Article",
                        "description": post.excerpt || "",
                        "url": `https://www.sanaathrumylens.com/blogs/${post.slug || post.id}`,
                        "datePublished": datePublished,
                        "author": {
                            "@type": "Person",
                            "name": post.authorSnapshot?.name || post.author || "Anonymous"
                        }
                    }
                };
            })
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredDataScript)
                }}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-2 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Content Area - 3 columns */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Search and filter */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1 min-w-60">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 w-full sm:w-auto shrink-0">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full sm:w-auto min-w-50 px-3 py-2.5 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                                >
                                    <option value="">All Categories</option>
                                    {loading ? (
                                        <option disabled>Loading categories...</option>
                                    ) : (
                                        initialCategories.map((category) => (
                                            <option key={category.id} value={category.name}>
                                                {category.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* total post + View Toggle */}
                        <div className="flex items-center justify-between p-1">
                            <span className="text-xs sm:text-sm text-gray-500">
                                {loading ? (
                                    <span className="inline-block w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                ) : isFiltering || searchQuery || selectedCategory ? (
                                    `Showing ${posts.length} results`
                                ) : (
                                    `Page ${currentPage} • ${posts.length} articles`
                                )}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow text-orange-500' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    aria-label="Grid view"
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-orange-500' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    aria-label="List view"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Articles Grid */}
                        {loading && posts.length === 0 ? (
                            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <PostCardSkeleton key={index} viewMode={viewMode} />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
                                    {posts.map((post) => (
                                        <div
                                            key={`${post.id}-${post.publishedAt || ''}`}
                                            className={`bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 ${viewMode === 'list' ? 'flex gap-4 p-4' : ''}`}
                                        >
                                            <Link
                                                href={`/blogs/${post.slug || post.id}`}
                                                className={`block ${viewMode === 'list' ? 'w-48 h-32 shrink-0' : ''}`}
                                            >
                                                <div className={`relative ${viewMode === 'list' ? 'w-full h-full' : 'aspect-video'}`}>
                                                    {(post.coverImage || post.featuredImage) ? (
                                                        <Image
                                                            src={post.coverImage || post.featuredImage}
                                                            alt={`${post.title} — Featured image`}
                                                            fill
                                                            className="object-cover"
                                                            sizes={viewMode === 'list' ? "192px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                            <div className="text-gray-400">
                                                                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                                                                <p className="text-xs">No image</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3">
                                                        {post.category && (
                                                            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                                                                {post.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>

                                            <div className={viewMode === 'list' ? 'flex-1' : 'p-4'}>
                                                <div className={`${viewMode === 'list' ? 'mb-2' : 'mb-3'}`}>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(post.publishedAt)}
                                                    </span>
                                                </div>

                                                <Link href={`/blogs/${post.slug || post.id}`}>
                                                    <h3 className={`font-bold hover:text-orange-500 transition-colors ${viewMode === 'list' ? 'text-lg mb-2' : 'mb-2 line-clamp-2'}`}>
                                                        {post.title}
                                                    </h3>
                                                </Link>

                                                <p className={`text-gray-600 ${viewMode === 'list' ? 'text-sm mb-3' : 'text-sm mb-3 line-clamp-2'}`}>
                                                    {post.excerpt}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <User size={12} />
                                                            {post.authorSnapshot?.name || post.author || 'Anonymous'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Heart size={12} />
                                                            {post.stats?.likes || 0}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={12} />
                                                            {post.stats?.comments || 0}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={`/blogs/${post.slug || post.id}`}
                                                        className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
                                                    >
                                                        Read More
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {hasMore && posts.length > 0 && (
                                    <div className="text-center mt-8">
                                        <button
                                            onClick={fetchMorePosts}
                                            disabled={loadingMore}
                                            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader size={18} className="animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load More Articles'
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Showing {posts.length} of {initialTotalPosts} articles • Page {currentPage}
                                        </p>
                                    </div>
                                )}

                                {/* Hidden pagination for SEO (screen readers only) */}
                                <nav className="sr-only" aria-label="Pagination">
                                    <h3>Page Navigation</h3>
                                    <ul>
                                        {currentPage > 1 && (
                                            <li>
                                                <Link href={`/blogs?page=${currentPage - 1}`} rel="prev">
                                                    Previous Page
                                                </Link>
                                            </li>
                                        )}
                                        {getPageNumbers().map(pageNum => (
                                            <li key={pageNum}>
                                                <Link
                                                    href={`/blogs?page=${pageNum}`}
                                                    aria-current={pageNum === currentPage ? 'page' : undefined}
                                                >
                                                    Page {pageNum}
                                                </Link>
                                            </li>
                                        ))}
                                        {hasMore && (
                                            <li>
                                                <Link href={`/blogs?page=${currentPage + 1}`} rel="next">
                                                    Next Page
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                </nav>

                                {/* No Results */}
                                {posts.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-lg shadow">
                                        <div className="text-gray-400 text-5xl mb-4">📝</div>
                                        <h3 className="text-xl font-bold mb-2">No articles found</h3>
                                        <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                                        <button
                                            onClick={handleClearFilters}
                                            className="text-orange-500 hover:text-orange-600 font-medium"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Sidebar - 1 column */}
                    <div className="space-y-6">
                        {/* Featured Story */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-orange-500 rounded"></div>
                                Featured Story
                            </h3>
                            {loading && !initialFeaturedStory ? (
                                <FeaturedStorySkeleton />
                            ) : initialFeaturedStory ? (
                                <>
                                    <Link href={`/blogs/${initialFeaturedStory.slug || initialFeaturedStory.id}`} className="block">
                                        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                                            {initialFeaturedStory.featuredImage ? (
                                                <Image
                                                    src={initialFeaturedStory.featuredImage}
                                                    alt={`${initialFeaturedStory.title} — Featured image`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    sizes="320px"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <h4 className="font-bold text-sm mb-2 line-clamp-2 hover:text-orange-500">
                                        <Link href={`/blogs/${initialFeaturedStory.slug || initialFeaturedStory.id}`}>
                                            {initialFeaturedStory.title}
                                        </Link>
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                                        {initialFeaturedStory.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{formatDate(initialFeaturedStory.publishedAt)}</span>

                                    </div>
                                    <Link
                                        href={`/blogs/${initialFeaturedStory.slug || initialFeaturedStory.id}`}
                                        className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-3 inline-flex items-center gap-1"
                                    >
                                        Read Full Story
                                        <ArrowRight size={14} />
                                    </Link>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No featured story available</p>
                            )}
                        </div>

                        {/* Recent Stories */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded"></div>
                                Recent Stories
                            </h3>
                            {loading && initialRecentStories.length === 0 ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <RecentStorySkeleton key={index} />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {initialRecentStories.map((story, idx) => (
                                        <div key={idx} className="pb-4 border-b last:border-0 last:pb-0">
                                            <div className="flex gap-3">
                                                <Link href={`/blogs/${story.slug || story.id}`} className="shrink-0">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                                        {story.featuredImage && (
                                                            <Image
                                                                src={story.featuredImage}
                                                                alt={`${story.title} — Thumbnail`}
                                                                width={64}
                                                                height={64}
                                                                className="w-full h-full object-cover"
                                                                unoptimized
                                                            />
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold mb-1 line-clamp-2 hover:text-orange-500">
                                                        <Link href={`/blogs/${story.slug || story.id}`}>
                                                            {story.title}
                                                        </Link>
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {formatDate(story.publishedAt)}
                                                        </span>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Popular Articles */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-red-500 rounded"></div>
                                Popular Articles
                            </h3>
                            {loading && initialPopularArticles.length === 0 ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <PopularArticleSkeleton key={index} />
                                    ))}
                                </div>
                            ) : initialPopularArticles.length > 0 ? (
                                <div className="space-y-3">
                                    {initialPopularArticles.map((article, idx) => (
                                        <div key={article.id || idx} className="pb-3 border-b last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-400">#{idx + 1}</span>
                                                <div className="flex-1">
                                                    <Link href={`/blogs/${article.slug || article.id}`}>
                                                        <h4 className="text-sm font-semibold line-clamp-1 hover:text-orange-500">
                                                            {article.title || 'Untitled Article'}
                                                        </h4>
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatDate(article.publishedAt)}</span>
                                                <span className="flex items-center gap-1">
                                                    <Heart size={10} />
                                                    {article.stats?.likes || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No popular articles available</p>
                            )}
                        </div>

                        {/* Newsletter */}
                        <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-2">Stay on the Lens</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Get essays, reviews, and creative commentary delivered straight to your inbox—when it matters.
                            </p>
                            <input
                                type="email"
                                placeholder="Your Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-orange-200 rounded-lg mb-3 text-sm bg-white focus:outline-none focus:border-orange-500"
                            />
                            <button
                                onClick={handleNewsletterSubscribe}
                                disabled={newsletterLoading}
                                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                            </button>
                            {newsletterMessage && (
                                <p className={`text-xs mt-3 text-center ${newsletterMessage.includes('already') || newsletterMessage.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                                    {newsletterMessage}
                                </p>
                            )}
                            <p className="text-xs text-gray-600 mt-3 text-center">
                                By subscribing you agree to our terms and conditions.
                            </p>
                        </div>

                        {/* Categories */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="w-2 h-6 bg-green-500 rounded"></div>
                                Categories
                            </h3>
                            {loading && initialCategories.length === 0 ? (
                                <CategorySkeleton />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`px-2 py-0.5 rounded-xl text-sm transition-colors ${selectedCategory === '' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        All
                                    </button>
                                    {initialCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.name)}
                                            className={`px-2 py-0.5 rounded-xl text-sm transition-colors ${selectedCategory === category.name ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        <div className="bg-white rounded-lg shadow p-5">
                            <h3 className="font-bold text-lg mb-4 text-center">Follow Us</h3>
                            <div className="flex justify-center gap-3">
                                <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                    <Facebook size={20} className="text-white" />
                                </button>
                                <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                                    <span className="text-white font-semibold">X</span>
                                </button>
                                <button className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                                    <span className="text-white font-semibold">IG</span>
                                </button>
                                <button className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                                    <span className="text-white font-semibold">YT</span>
                                </button>
                                <button className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                                    <Share2 size={18} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google AdSense Ad */}
            <div style={{ margin: '32px 0', display: 'flex', justifyContent: 'center' }}>
                <AdsGoogle slot="9560397147" style={{ display: 'block', minHeight: 90, minWidth: 320, width: '100%' }} />
            </div>
        </div>
    );
}