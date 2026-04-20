"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { sanitizeHtml } from '@/lib/sanitize';
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Bookmark, Eye, Share2, Calendar, Clock, Heart, Twitter, Facebook } from "lucide-react";

const ShareDropdown = lazy(() => import("./_components/ShareDropdown"));
const CommentsSection = lazy(() => import("./_components/CommentsSection"));

import AuthorBio from "./_components/AuthorBio";
import RelatedArticles from "./_components/RelatedArticles";
import RecentStories from "./_components/RecentStories";
import ArticlesByAuthor from "./_components/ArticlesByAuthor";
import SubscriptionForm from "./_components/SubscriptionForm";
import { IconButton } from "./_components/IconButton";
import { SectionTitle } from "./_components/SectionTitle";
import { ArticleHeaderSkeleton, RelatedPostsSkeleton, SidebarSkeleton, FeaturedImageSkeleton, ContentSkeleton, } from "./_components/SkeletalLoader";

export default function BlogPostClient({ initialPostData, slug }) {
    const { user: authUser, isAuthenticated } = useAuth();
    const observerRef = useRef(null);

    // Use initial data immediately
    const [post, setPost] = useState(initialPostData?.post || null);
    const [recentStories, setRecentStories] = useState(initialPostData?.recentStories || []);
    const [articlesByAuthor, setArticlesByAuthor] = useState(initialPostData?.articlesByAuthor || []);
    const [relatedArticles, setRelatedArticles] = useState(initialPostData?.relatedArticles || []);
    const [categories, setCategories] = useState(initialPostData?.categories || []);
    const [viewCount, setViewCount] = useState(initialPostData?.viewCount || 0);

    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const viewTrackedRef = useRef(false);

    /**
     * Check if this post was viewed in current session
     */
    const canTrackView = (postId) => {
        if (typeof window === 'undefined') return false;
        return !sessionStorage.getItem(`viewed_${postId}`);
    };

    /**
     * Mark post as viewed for this session
     */
    const markViewTracked = (postId) => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(`viewed_${postId}`, 'true');
    };

    // View tracking useEffect - only run once
    useEffect(() => {
        if (!post?.id || viewTrackedRef.current) return;
        if (!canTrackView(post.id)) return;

        const timer = setTimeout(async () => {
            try {
                await fetch(`/api/posts/${post.id}`, { credentials: 'include' });
                markViewTracked(post.id);
                viewTrackedRef.current = true;
            } catch (error) {
                console.error('View tracking failed:', error);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [post?.id]);

    // Fetch user-specific data only (likes/bookmarks)
    useEffect(() => {
        if (!post?.id) return;

        const fetchUserData = async () => {
            if (authUser && isAuthenticated()) {
                try {
                    // Skip individual check endpoints - just initialize to false
                    // The toggle endpoints will manage the state
                    setLiked(false);
                    setBookmarked(false);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setLiked(false);
                setBookmarked(false);
            }
        };

        fetchUserData();
    }, [post?.id, authUser, isAuthenticated]);

    // Only fetch new data if slug changes AND we don't have post data
    useEffect(() => {
        const fetchPostData = async () => {
            // Skip if we already have data or same slug
            if (post?.slug === slug || loading) return;

            try {
                setLoading(true);
                setError(null);
                viewTrackedRef.current = false;

                const res = await fetch(`/api/posts/${slug}`);
                const result = await res.json();

                if (!result.success || !result.data) {
                    throw new Error("Post not found");
                }

                const newPost = result.data;
                setPost(newPost);
                setViewCount(newPost.stats?.views || 0);
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Post not found or failed to load");
            } finally {
                setLoading(false);
            }
        };

        if (slug && !post) {
            fetchPostData();
        }
    }, [slug, post, loading]);

    const handleLike = async () => {
        if (!post?.id) return;

        if (!authUser || !isAuthenticated()) {
            toast.error("You must be logged in to like posts");
            return;
        }

        try {
            const res = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            const result = await res.json();

            if (result.success) {
                setLiked(result.liked !== undefined ? result.liked : !liked);
                toast.success(result.liked ? "Post liked!" : "Post unliked");
            } else {
                toast.error(result.message || result.error || "Failed to like post");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        }
    };

    const handleBookmark = async () => {
        if (!post?.id || bookmarkLoading) return;

        if (!authUser || !isAuthenticated()) {
            toast.error("You must be logged in to bookmark posts");
            return;
        }

        setBookmarkLoading(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/bookmark`, {
                method: 'POST',
                credentials: 'include',
            });
            const result = await res.json();

            if (result.success) {
                setBookmarked(result.bookmarked !== undefined ? result.bookmarked : !bookmarked);
                toast.success(result.message);
            } else {
                toast.error(result.message || "Failed to bookmark post");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        } finally {
            setBookmarkLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatReadingTime = (minutes) => {
        if (!minutes) return "1 min read";
        return `${Math.max(1, minutes)} min read`;
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find((cat) => cat.id === categoryId);
        return category?.name || "Uncategorized";
    };

    // Show loading only when we don't have initial data
    if (loading && !post) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <main className="lg:col-span-3">
                            <ArticleHeaderSkeleton />
                            <FeaturedImageSkeleton />
                            <ContentSkeleton />
                            <RelatedPostsSkeleton />
                        </main>
                        <SidebarSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="relative min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center max-w-md p-8 bg-white rounded-lg border border-gray-200">
                    <div className="text-red-500 text-5xl mb-4">📄</div>
                    <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        {error || "The article doesn't exist"}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/blogs"
                            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                        >
                            ← Back to Blog
                        </Link>
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const mainTopics = post.tags || post.categoryIds?.map((id) => getCategoryName(id)) || [];
    const sidebarTopics = [
        ...new Set([
            ...mainTopics,
            ...categories.map((cat) => cat.name).slice(0, 7),
        ]),
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <main className="lg:col-span-3 space-y-6">
                        <div className="col-span-3 text-sm text-gray-600">
                            <Link href="/" className="hover:text-gray-900">
                                Home
                            </Link>
                            {" / "}
                            <Link href="/blogs" className="hover:text-gray-900">
                                Blogs
                            </Link>
                            {" / "}
                            <span className="text-gray-900">{post.title}</span>
                        </div>

                        <div className="col-span-3">
                            <h1 className="text-xl font-bold mb-6 leading-tight">
                                {post.title}
                            </h1>

                            <div className="text-xs items-center gap-4 text-gray-600 mb-2 sm:text-[12px]">
                                <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                                    <p className="font-medium">
                                        {post.author?.name || "Anonymous"}
                                    </p> |
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(post.publishedAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatReadingTime(post.readingTime)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye size={14} />
                                        {viewCount} views
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(post.coverImage || post.featuredImage) && (
                            <div className="col-span-3">
                                <div className="relative aspect-video rounded mb-8 overflow-hidden">
                                    <Image
                                        src={post.coverImage || post.featuredImage}
                                        alt={`${post.title} — Featured image`}
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                        loading="lazy"
                                        priority={false}
                                        placeholder="blur"
                                        blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdAD6H/9k="
                                        />

                                </div>
                            </div>
                        )}

                        <div className="col-span-3">
                            <article className="text-gray-700 leading-relaxed text-sm space-y-4">
                                {post.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                                ) : (
                                    <ContentSkeleton />
                                )}
                            </article>
                        </div>

                        <div className="col-span-3">
                            <div className="flex items-center gap-3 py-6 border-t border-b border-gray-200">
                                <IconButton
                                    label="Bookmark article"
                                    active={bookmarked}
                                    onClick={handleBookmark}
                                    className={bookmarked ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
                                >
                                    <Bookmark size={18} className={bookmarked ? "fill-blue-600" : ""} />
                                </IconButton>
                                <IconButton
                                    label="Like article"
                                    active={liked}
                                    onClick={handleLike}
                                    className={
                                        liked ? "bg-red-50 border-red-200 text-red-600" : ""
                                    }
                                >
                                    <Heart size={18} className={liked ? "fill-red-600" : ""} />
                                </IconButton>
                                <IconButton
                                    label="Share on Facebook"
                                    onClick={() => {
                                        const url = typeof window !== "undefined" ? window.location.href : "";
                                        window.open(
                                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                                            "_blank",
                                            "width=600,height=400"
                                        );
                                    }}
                                    className="bg-blue-600 text-white border-none hover:bg-blue-700"
                                >
                                    <Facebook size={18} />
                                </IconButton>
                                <div className="relative">
                                    <IconButton
                                        label="Share article"
                                        onClick={() => setShowShareDropdown(!showShareDropdown)}
                                    >
                                        <Share2 size={18} />
                                    </IconButton>
                                    {showShareDropdown && (
                                        <Suspense fallback={
                                            <div className="absolute left-0 top-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg p-2 min-w-48 z-10 animate-pulse">
                                                <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[...Array(4)].map((_, i) => (
                                                        <div key={i} className="h-8 bg-gray-200 rounded"></div>
                                                    ))}
                                                </div>
                                            </div>
                                        }>
                                            <ShareDropdown
                                                url={typeof window !== "undefined" ? window.location.href : ""}
                                                title={post.title}
                                                excerpt={post.excerpt || ""}
                                                onClose={() => setShowShareDropdown(false)}
                                            />
                                        </Suspense>
                                    )}
                                </div>
                            </div>
                        </div>

                        {mainTopics.length > 0 && (
                            <div className="col-span-3 py-2">
                                <SectionTitle>Topics</SectionTitle>
                                <div className="flex flex-wrap gap-3">
                                    {mainTopics.slice(0, 7).map((topic, index) => {
                                        const tagSlug = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'));
                                        return (
                                            <Link
                                                key={index}
                                                href={`/tags/${tagSlug}`}
                                                className="text-sm hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer inline-block"
                                            >
                                                #{topic}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {post.author && (
                            <Link
                                href={`/author/${post.author.slug || post.author.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
                                className="block col-span-3 hover:opacity-90 transition"
                            >
                                <AuthorBio author={post.author} />
                            </Link>
                        )}

                        <Suspense fallback={<RelatedPostsSkeleton />}>
                            {relatedArticles.length > 0 && (
                                <div className="col-span-3 mt-12">
                                    <RelatedArticles articles={relatedArticles} categories={categories} />
                                </div>
                            )}
                        </Suspense>

                        <Suspense
                            fallback={
                                <div className="col-span-3 mb-12">
                                    <div className="h-8 w-32 bg-gray-300 animate-pulse rounded-lg mb-6"></div>
                                    <div className="bg-white rounded-xl p-6 h-40">
                                        <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4 mx-auto"></div>
                                    </div>
                                </div>
                            }
                        >
                            <div id="comments" className="col-span-3 mb-12">
                                <div className="bg-white rounded-xl">
                                    <CommentsSection postId={post.id} />
                                </div>
                            </div>
                        </Suspense>
                    </main>

                    <aside className="lg:col-span-1 space-y-5 sticky top-6 self-start gap-4">
                        <RecentStories stories={recentStories} />
                        <SubscriptionForm />
                        {articlesByAuthor.length > 0 && (
                            <ArticlesByAuthor
                                articles={articlesByAuthor}
                                authorName={post.author?.name || "This Author"}
                            />
                        )}
                        <div className="bg-white border-gray-200 rounded-xl p-4 shadow-sm">
                            <SectionTitle>Topics</SectionTitle>
                            <div className="flex flex-wrap gap-2">
                                {sidebarTopics.slice(0, 8).map((topic, index) => {
                                    const tagSlug = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'));
                                    return (
                                        <Link
                                            key={index}
                                            href={`/tags/${tagSlug}`}
                                            className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer inline-block"
                                        >
                                            {topic}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white border-gray-200 rounded-lg p-4">
                            <SectionTitle>Follow us</SectionTitle>
                            <div className="grid grid-cols-2 gap-3">
                                <IconButton
                                    label="Facebook"
                                    onClick={() => window.open("https://facebook.com", "_blank")}
                                    className="bg-blue-600 text-white border-none"
                                >
                                    <Facebook size={20} />
                                </IconButton>
                                <IconButton
                                    label="Twitter"
                                    onClick={() => window.open("https://twitter.com", "_blank")}
                                    className="bg-blue-400 text-white border-none"
                                >
                                    <Twitter size={20} />
                                </IconButton>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}