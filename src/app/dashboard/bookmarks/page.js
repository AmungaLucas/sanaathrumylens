// src/app/dashboard/bookmarks/page.js
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Calendar, Clock, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BookmarksPage() {
    const { user: authUser, loading: authLoading, isAuthenticated } = useAuth();
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBookmarks = async () => {
        if (!authUser || !isAuthenticated()) {
            setBookmarks([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/bookmarks', { credentials: 'include' });
            const result = await res.json();
            if (result.success) {
                setBookmarks(result.data || []);
            } else {
                toast.error(result.error || 'Failed to load bookmarks');
            }
        } catch (error) {
            console.error("Error fetching bookmarks:", error);
            toast.error("Failed to load bookmarks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, [authUser, isAuthenticated]);

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">My Bookmarks</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse h-64"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!authUser || !isAuthenticated()) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center p-8">
                    <Bookmark size={64} className="mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2">Sign in to view bookmarks</h2>
                    <p className="text-gray-600 mb-6">
                        Bookmark articles to read them later
                    </p>
                    <Link
                        href="/login"
                        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">My Bookmarks</h1>
                        <p className="text-gray-600 mt-2">
                            {bookmarks.length} saved {bookmarks.length === 1 ? "article" : "articles"}
                        </p>
                    </div>
                    <Bookmark size={32} className="text-gray-400" />
                </div>

                {bookmarks.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                        <Bookmark size={64} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                        <p className="text-gray-600 mb-6">
                            Start bookmarking articles to read them later
                        </p>
                        <Link
                            href="/blogs"
                            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Browse Articles
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookmarks.map((bookmark) => (
                            <Link
                                key={bookmark.bookmarkId}
                                href={`/blogs/${bookmark.post.slug || bookmark.post.id}`}
                                className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {(bookmark.post.coverImage || bookmark.post.featuredImage) && (
                                    <div className="relative aspect-video overflow-hidden">
                                        <Image
                                            src={bookmark.post.coverImage || bookmark.post.featuredImage}
                                            alt={`${bookmark.post.title} — Bookmark thumbnail`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {bookmark.post.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {bookmark.post.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDate(bookmark.post.publishedAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye size={12} />
                                            {bookmark.post.stats?.views || 0} views
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-400">
                                        Bookmarked on {formatDate(bookmark.bookmarkedAt)}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}