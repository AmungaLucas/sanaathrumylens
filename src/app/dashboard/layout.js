'use client';

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-t-gray-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Please log in to access the dashboard.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <main className="flex-1 p-6 bg-gray-50">
                {children}
            </main>
        </div>
    );
}
