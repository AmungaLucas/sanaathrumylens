// src/utils/userUtils.js

/**
 * Get user display name
 * @param {Object|null} user
 * @returns {string}
 */
export function getUserDisplayName(user) {
    if (!user) return 'Anonymous';
    return user.displayName || user.email?.split('@')[0] || 'User';
}

/**
 * Get user avatar data
 * @param {Object|null} user
 * @returns {Object} { type: 'image'|'initials', ... }
 */
export function getUserAvatar(user) {
    if (!user) {
        return { type: 'initials', initials: '?', backgroundColor: '#6b7280' };
    }
    if (user.avatar) {
        return { type: 'image', url: user.avatar };
    }
    const name = getUserDisplayName(user);
    const initials = name.charAt(0).toUpperCase();
    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return { type: 'initials', initials, backgroundColor: colors[colorIndex] };
}
