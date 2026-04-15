// src/hooks/useBlogData.js
import { useState, useEffect } from 'react';

export const useBlogData = () => {
    const [data, setData] = useState({
        articles: [],
        recentStories: [],
        popularArticles: [],
        featuredArticle: null,
        upcomingEvents: [],
        categories: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setData(prev => ({ ...prev, loading: true, error: null }));

                const [postsRes, eventsRes, categoriesRes] = await Promise.all([
                    fetch('/api/posts?limit=6&sort=publishedAt&sortDir=desc').then(r => r.json()),
                    fetch('/api/events?limit=4').then(r => r.json()),
                    fetch('/api/categories').then(r => r.json()),
                ]);

                if (!postsRes.success) throw new Error(postsRes.error || 'Failed to load posts');

                const articles = postsRes.data || [];
                const events = eventsRes.success ? (eventsRes.data || []) : [];
                const categories = categoriesRes.success ? (categoriesRes.data || []) : [];

                // Derive recent stories, popular, featured from posts
                const recentStories = articles.slice(0, 4);

                // Sort by views for popular
                const popularArticles = [...articles].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 3);

                // Find featured
                const featuredArticle = articles.find(p => p.isFeatured) || articles[0] || null;

                setData({
                    articles,
                    recentStories,
                    popularArticles,
                    featuredArticle,
                    upcomingEvents: events,
                    categories,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                console.error('Error fetching blog data:', error);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load content. Please refresh the page.',
                }));
            }
        };
        fetchAllData();
    }, []);

    const subscribeNewsletter = async (email) => {
        try {
            const res = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return await res.json();
        } catch (error) {
            return { success: false, message: 'Subscription failed' };
        }
    };

    const likePost = async (postId) => {
        const res = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include',
        });
        return await res.json();
    };

    const unlikePost = async (postId) => {
        const res = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include',
        });
        return await res.json();
    };

    const checkUserLike = async (postId) => {
        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'GET',
                credentials: 'include',
            });
            // For now just return false - the toggle endpoint handles it
            return false;
        } catch { return false; }
    };

    const trackPostView = async (postId) => {
        try {
            await fetch(`/api/posts/${postId}`, { credentials: 'include' });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const addComment = async (postId, commentData) => {
        try {
            const res = await fetch(`/api/posts/${postId}/comments/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(commentData),
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return {
        ...data,
        subscribeNewsletter, trackPostView,
        likePost, unlikePost, checkUserLike, addComment,
    };
};
