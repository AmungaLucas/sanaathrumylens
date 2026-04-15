'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LikeButton({ postId, initialLikes = 0, className = '' }) {
    const { isAuthenticated } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikes);

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated()) {
            alert('Please log in to like posts');
            return;
        }

        try {
            const res = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await res.json();

            if (data.success) {
                // Toggle local state based on server response
                // The API toggles: if liked -> unliked, if not liked -> liked
                setLiked(prev => !prev);
                setLikesCount(prev => liked ? prev - 1 : prev + 1);
            }
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-1 transition-colors ${
                liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
            } ${className}`}
            aria-label={liked ? 'Unlike post' : 'Like post'}
        >
            <Heart
                size={14}
                className={liked ? 'fill-red-500' : ''}
            />
            {likesCount}
        </button>
    );
}
