// src/contexts/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                const data = await res.json();
                if (data.success && data.data) {
                    setUser(data.data);
                    setProfile(data.data);
                    setRole(data.data.roles?.[0] || 'user');
                }
            } catch (err) {
                console.error('Session check failed:', err);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const loginWithEmail = async (email, password) => {
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
                setProfile(data.data);
                setRole(data.data.roles?.[0] || 'user');
                return { success: true };
            } else {
                setError(data.error || 'Login failed');
                return { success: false, error: data.error };
            }
        } catch (err) {
            setError('Login failed');
            return { success: false, error: 'Network error' };
        }
    };

    const signupWithEmail = async (email, password, displayName) => {
        setError(null);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, displayName }),
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
                setProfile(data.data);
                setRole('user');
                return { success: true };
            } else {
                setError(data.error || 'Signup failed');
                return { success: false, error: data.error };
            }
        } catch (err) {
            setError('Signup failed');
            return { success: false, error: 'Network error' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            console.error('Logout error:', err);
        }
        setUser(null);
        setProfile(null);
        setRole('user');
    };

    const isAdmin = () => role === 'admin';
    const isEditor = () => role === 'editor';
    const isModerator = () => role === 'moderator';
    const isAuthenticated = () => !!user;

    const canComment = () => {
        if (!user) return false;
        const restrictedRoles = ['banned', 'restricted'];
        if (profile?.roles?.some(r => restrictedRoles.includes(r))) return false;
        return true;
    };

    const canModerate = () => isAdmin() || isEditor() || isModerator();
    const isCommentOwner = (commentUserId) => user?.id?.toString() === commentUserId?.toString();
    const canDeleteComment = (commentUserId) => canModerate() || isCommentOwner(commentUserId);

    const refreshProfile = async () => {
        try {
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.data) {
                setUser(data.data);
                setProfile(data.data);
                setRole(data.data.roles?.[0] || 'user');
            }
        } catch (err) {
            console.error('Profile refresh failed:', err);
        }
    };

    // NOTE: Google login removed - no more Firebase auth provider

    const value = {
        user,
        profile,
        role,
        loading,
        error,
        isAuthenticated,
        loginWithEmail,
        signupWithEmail,
        logout,
        refreshProfile,
        isAdmin,
        isEditor,
        isModerator,
        canComment,
        canModerate,
        isCommentOwner,
        canDeleteComment,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
