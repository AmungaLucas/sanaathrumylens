"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const { user, loading, logout, isAuthenticated } = useAuth();

    const navItems = [
        { href: "/", label: "Home", exact: true },
        { href: "/about", label: "About" },
        { href: "/blogs", label: "Blogs" },
        { href: "/events", label: "Events" },
        { href: "/contacts", label: "Contacts" },
    ];

    // Local helpers for display name and avatar (no external Firebase utils)
    const getDisplayName = () =>
        user?.displayName || user?.email?.split('@')[0] || 'User';

    const getAvatarColor = () => {
        const name = getDisplayName();
        const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];
        return colors[name.charCodeAt(0) % colors.length];
    };

    const getInitials = () =>
        getDisplayName().charAt(0).toUpperCase();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        queueMicrotask(() => setIsOpen(false));
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => (document.body.style.overflow = "unset");
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                setProfileOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const isActive = (href, exact = false) => {
        if (exact || href === "/") return pathname === href;
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain"
                                priority={true}
                                fetchPriority="high"
                            />
                        </div>
                        <span className="font-semibold text-gray-800 text-lg">Sanaathrumylens</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => {
                            const active = isActive(item.href, item.exact);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative px-3 py-2 text-sm font-medium transition-colors ${active
                                        ? "text-orange-500"
                                        : "text-gray-600 hover:text-orange-500"
                                        }`}
                                >
                                    {item.label}
                                    <span
                                        className={`absolute left-0 -bottom-1 w-full h-0.5 transition-all ${active ? "bg-orange-500" : "bg-transparent"
                                            }`}
                                    />
                                </Link>
                            );
                        })}

                        {!loading && isAuthenticated() && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                                >
                                    {user && (
                                        <>
                                            {user?.avatar ? (
                                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                                    <Image
                                                        src={user.avatar}
                                                        alt={getDisplayName()}
                                                        width={32}
                                                        height={32}
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-semibold"
                                                    style={{ backgroundColor: getAvatarColor() }}
                                                >
                                                    {getInitials()}
                                                </div>
                                            )}
                                            <span className="max-w-25 truncate font-medium text-gray-700">
                                                {getDisplayName()}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white border rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setProfileOpen(false)}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setProfileOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 transition"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && !isAuthenticated() && (
                            <Link
                                href="/auth"
                                className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:text-orange-500 hover:bg-gray-50 transition"
                            >
                                Login
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        {isOpen ? "✕" : "☰"}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="absolute right-0 top-0 h-full w-64 max-w-full bg-white shadow-xl overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-semibold text-gray-800 text-lg">Menu</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Navigation Items */}
                            <div className="space-y-1 mb-6">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-4 py-3 rounded-lg text-sm transition ${isActive(item.href, item.exact)
                                            ? "text-orange-500 bg-orange-50"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Authentication Section */}
                            <div className="border-t pt-4">
                                {!loading && isAuthenticated() && user && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {user?.avatar ? (
                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                    <Image
                                                        src={user.avatar}
                                                        alt={getDisplayName()}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white font-semibold"
                                                    style={{ backgroundColor: getAvatarColor() }}
                                                >
                                                    {getInitials()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-800">{getDisplayName()}</p>
                                            </div>
                                        </div>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 transition"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}

                                {!loading && !isAuthenticated() && (
                                    <div className="space-y-1">
                                        <Link
                                            href="/auth"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 text-sm text-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                                        >
                                            Login / Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
