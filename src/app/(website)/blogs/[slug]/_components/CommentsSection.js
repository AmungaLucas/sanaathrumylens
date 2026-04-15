// CommentsSection.js - Updated with REST API calls instead of Firestore
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, ThumbsUp, MoreVertical, Trash2, Edit, Flag, ChevronDown, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SORT_OPTIONS = {
    NEWEST: { value: 'newest', label: 'Newest', icon: Clock },
    OLDEST: { value: 'oldest', label: 'Oldest', icon: Clock },
    MOST_LIKED: { value: 'most_liked', label: 'Most Liked', icon: TrendingUp }
};

const CommentsSection = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST.value);
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 10;

    // Use the auth hook instead of prop
    const { user, canComment, canModerate, canDeleteComment, isCommentOwner } = useAuth();
    const router = useRouter();

    // Refs
    const commentsEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Debug: Log auth state
    useEffect(() => {
        console.log('Auth state:', {
            hasUser: !!user,
            user: user ? { id: user.id, name: user.displayName } : null,
            canComment: canComment(),
            canModerate: canModerate()
        });
    }, [user, canComment, canModerate]);

    /**
     * Fetch comments from API
     */
    const fetchComments = useCallback(async (isInitialLoad = false) => {
        console.log('Fetching comments for postId:', postId, 'isInitialLoad:', isInitialLoad, 'sortBy:', sortBy);

        if (!postId) {
            console.error('ERROR: postId is undefined!');
            setComments([]);
            setLoading(false);
            return;
        }

        if (isInitialLoad) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const page = isInitialLoad ? 1 : currentPage;
            const res = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${commentsPerPage}&sort=${sortBy}`);
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load comments');
            }

            const fetchedComments = (data.data || []).map(c => ({
                id: c.id,
                content: c.content,
                userId: c.userId,
                userName: c.userName || c.author?.name || 'Anonymous',
                userAvatar: c.userAvatar || c.author?.avatar || '/default-avatar.png',
                likes: c.likes || 0,
                likedByUser: c.likedByUser || false,
                reportedByUser: c.reportedByUser || false,
                status: c.status,
                isDeleted: c.isDeleted,
                parentId: c.parentId,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                isEdited: c.isEdited || false,
                author: {
                    id: c.userId,
                    name: c.userName || c.author?.name || 'Anonymous',
                    avatar: c.userAvatar || c.author?.avatar || '/default-avatar.png',
                },
            }));

            if (isInitialLoad) {
                setComments(fetchedComments);
                setLoading(false);
            } else {
                setComments(prevComments => {
                    const existingIds = new Set(prevComments.map(c => c.id));
                    const newComments = fetchedComments.filter(c => !existingIds.has(c.id));
                    return [...prevComments, ...newComments];
                });
                setLoadingMore(false);
            }

            // Update pagination
            const pagination = data.pagination || {};
            setHasMore(pagination.hasMore || fetchedComments.length === commentsPerPage);
            if (!isInitialLoad) {
                setCurrentPage(prev => prev + 1);
            } else {
                setCurrentPage(2);
            }

        } catch (error) {
            console.error('Error fetching comments:', error);
            if (isInitialLoad) setLoading(false);
            else setLoadingMore(false);
            toast.error('Failed to load comments. Please refresh the page.');
        }
    }, [postId, sortBy, currentPage, commentsPerPage]);

    /**
     * Load more comments when scrolling to bottom
     */
    const loadMoreComments = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            fetchComments(false);
        }
    }, [loadingMore, hasMore, loading, fetchComments]);

    /**
     * Handle scroll event to detect when user reaches bottom
     */
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !commentsEndRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

        // Load more comments when user is within 200px of the bottom
        if (scrollHeight - scrollTop - clientHeight < 200) {
            loadMoreComments();
        }
    }, [loadMoreComments]);

    /**
     * Set up comments fetch when postId, user, or sortBy changes
     */
    useEffect(() => {
        // Reset pagination state when sort changes
        setCurrentPage(1);
        setHasMore(true);

        // Fetch comments with new sort option
        fetchComments(true);
    }, [fetchComments, sortBy]);

    /**
     * Set up scroll event listener
     */
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    /**
     * Handle click on comment area when not authenticated
     */
    const handleCommentAreaClick = () => {
        if (!user) {
            // Get current URL with hash for comments section
            const currentPath = window.location.pathname + window.location.search;
            // Add #comments to the redirect URL
            router.push(`/auth?redirect=${encodeURIComponent(currentPath + '#comments')}`);
        }
    };

    /**
     * Submit new comment
     */
    const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!newComment.trim() || !user || !postId) {
            console.warn('Cannot submit comment:', {
                hasContent: !!newComment.trim(),
                hasUser: !!user,
                hasPostId: !!postId,
            });
            return;
        }

        // Check if user is allowed to comment
        if (!canComment()) {
            alert('Your account is not allowed to comment at this time.');
            return;
        }

        try {
            setSubmitting(true);

            const res = await fetch(`/api/posts/${postId}/comments/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content: newComment,
                    parentId: null,
                }),
            });
            const result = await res.json();

            if (result.success) {
                setNewComment('');
                // Re-fetch comments to show the new one
                fetchComments(true);
                toast.success('Comment posted successfully!');
            } else {
                toast.error(result.message || result.error || 'Failed to post comment.');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error('Failed to post comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Start editing a comment
     */
    const startEditingComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    /**
     * Save edited comment
     */
    const saveEditedComment = async (commentId) => {
        if (!editContent.trim()) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: editContent }),
            });
            const result = await res.json();

            if (result.success) {
                setEditingCommentId(null);
                setEditContent('');
                // Re-fetch to reflect changes
                fetchComments(true);
                toast.success('Comment updated successfully!');
            } else {
                toast.error('Failed to update comment: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment. Please try again.');
        }
    };

    /**
     * Delete a comment
     */
    const handleDeleteComment = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const result = await res.json();

            if (result.success) {
                // Re-fetch to reflect changes
                fetchComments(true);
                toast.success('Comment deleted successfully!');
            } else {
                toast.error('Failed to delete comment: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment. Please try again.');
        }
    };

    /**
     * Like a comment
     */
    const handleLikeComment = async (commentId) => {
        try {
            if (!user || !user.id) {
                const currentPath = window.location.pathname + window.location.search;
                router.push(`/auth?redirect=${encodeURIComponent(currentPath + '#comments')}`);
                return;
            }

            // Optimistic UI update for instant feedback
            const originalComments = [...comments];
            setComments(prevComments =>
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        const wasLiked = comment.likedByUser;
                        return {
                            ...comment,
                            likes: wasLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1,
                            likedByUser: !wasLiked,
                        };
                    }
                    return comment;
                })
            );

            const res = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            const result = await res.json();

            if (result.success) {
                toast.success(result.liked ? 'Comment liked!' : 'Comment unliked!');
                // Re-fetch to get correct count
                fetchComments(true);
            } else {
                // Revert the optimistic update on failure
                setComments(originalComments);
                toast.error(result.error || 'Failed to like comment');
            }
        } catch (error) {
            console.error('Error in handleLikeComment:', error);
            toast.error('An error occurred. Please try again.');
        }
    };

    /**
     * Report a comment
     */
    const handleReportComment = async (commentId) => {
        if (!user || !user.id) {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/auth?redirect=${encodeURIComponent(currentPath + '#comments')}`);
            return;
        }

        try {
            const res = await fetch(`/api/comments/${commentId}/report`, {
                method: 'POST',
                credentials: 'include',
            });
            const result = await res.json();

            if (result.success) {
                toast.success('Comment reported. Thank you for your feedback.');
                // Re-fetch to reflect the reported status
                fetchComments(true);
            } else {
                toast.error(result.error || 'Failed to report comment');
            }
        } catch (error) {
            console.error('Error reporting comment:', error);
            toast.error('Error reporting comment. Please try again.');
        }
    };

    /**
     * Format timestamps
     */
    const formatTimeAgo = (date) => {
        if (!date) return 'Just now';

        const commentDate = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now - commentDate) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return commentDate.toLocaleDateString();
    };

    /**
     * Render comment action buttons based on user permissions
     */
    const renderCommentActions = (comment) => {
        const canEdit = isCommentOwner(comment.userId);
        const canDelete = canDeleteComment(comment.userId);
        const showLikeButton = user !== null;

        return (
            <div className="flex gap-2 mt-2">
                {/* Like button - show for all authenticated users */}
                {showLikeButton && (
                    <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`text-xs flex items-center gap-1 ${comment.likedByUser ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <ThumbsUp size={12} className={comment.likedByUser ? 'fill-current' : ''} />
                        {comment.likes || 0}
                    </button>
                )}

                {!showLikeButton && (
                    <button
                        onClick={() => {
                            const currentPath = window.location.pathname + window.location.search;
                            router.push(`/auth?redirect=${encodeURIComponent(currentPath + '#comments')}`);
                        }}
                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600"
                    >
                        <ThumbsUp size={12} />
                        {comment.likes || 0}
                    </button>
                )}

                {/* Reply button - show for all */}
                <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                >
                    Reply
                </button>

                {/* Edit button - only for comment owner */}
                {canEdit && (
                    <button
                        onClick={() => startEditingComment(comment)}
                        className="text-xs text-gray-500 hover:text-green-600"
                    >
                        Edit
                    </button>
                )}

                {/* Delete button - for comment owner or moderators */}
                {canDelete && (
                    <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-500 hover:text-red-600"
                    >
                        Delete
                    </button>
                )}

                {/* Report button - for non-owners who haven't reported yet */}
                {!isCommentOwner(comment.userId) && user && (
                    <>
                        {comment.reportedByUser ? (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Flag size={12} />
                                Reported
                            </span>
                        ) : (
                            <button
                                onClick={() => handleReportComment(comment.id)}
                                className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                            >
                                <Flag size={12} />
                                Report
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    /**
     * Render sort options
     */
    const renderSortOptions = () => {
        return (
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                    {Object.values(SORT_OPTIONS).map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                className={`flex items-center gap-1 px-3 py-1 text-sm transition-colors ${sortBy === option.value
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={14} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        // Added id="comments" here - users will be navigated to this section after auth
        <div id="comments" className="w-full mx-auto space-y-10">

            {/* Comment Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
                <h3 className="text-lg font-semibold mb-2">
                    Comments ({comments.length})
                </h3>

                {user ? (
                    <form onSubmit={handleSubmitComment} className="space-y-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write your comment…"
                            rows={3}
                            disabled={!canComment()}
                            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm 
                     focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition"
                        />

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                {!canComment()
                                    ? 'Your account is not allowed to comment'
                                    : `${comments.length} comments`}
                            </p>

                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim() || !canComment()}
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white 
                       hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                                {submitting ? 'Posting…' : 'Post comment'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div
                        onClick={handleCommentAreaClick}
                        className="rounded-xl border border-gray-200 p-6 space-y-4 
                   hover:border-gray-300 transition cursor-pointer bg-gray-50"
                    >
                        <textarea
                            readOnly
                            rows={3}
                            placeholder="Sign in to comment"
                            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm bg-white"
                        />

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Sign in to join the discussion
                            </p>

                            <button
                                type="button"
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white 
                       hover:bg-gray-800 transition"
                            >
                                Sign in
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sort Options */}
            {renderSortOptions()}

            {/* Comments List with Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="space-y-6 max-h-150 overflow-y-auto pr-2"
            >
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                    <div className="space-y-1">
                                        <div className="h-3 w-24 bg-gray-200 rounded" />
                                        <div className="h-2 w-16 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded" />
                                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No comments yet. Be the first!
                    </div>
                ) : (
                    <>
                        {comments.map(comment => (
                            <div key={comment.id} className="border-b border-gray-200 pb-5 last:border-0">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                                        <Image
                                            src={comment.author.avatar}
                                            alt={`Avatar of ${comment.author.name}`}
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-gray-900">
                                                {comment.author.name}
                                            </span>
                                            {comment.userId === user?.id && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                    You
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {formatTimeAgo(comment.createdAt)}
                                            </span>
                                            {comment.isEdited && (
                                                <span className="text-xs text-gray-400">(edited)</span>
                                            )}
                                        </div>

                                        {editingCommentId === comment.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm 
                                   focus:ring-2 focus:ring-gray-200"
                                                />

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveEditedComment(comment.id)}
                                                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-800 transition"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCommentId(null)}
                                                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {comment.content}
                                                </p>
                                                {renderCommentActions(comment)}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading More Indicator */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                        )}

                        {/* End of Comments Marker for Scroll Detection */}
                        <div ref={commentsEndRef} />

                        {/* No More Comments Message */}
                        {!hasMore && comments.length > 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                No more comments to load
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;
