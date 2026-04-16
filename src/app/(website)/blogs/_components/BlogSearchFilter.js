"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export default function BlogSearchFilter({ initialSearch = '', initialCategory = '', categories = [] }) {
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const debounceRef = useRef(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Update local state when URL params change (e.g. browser back)
        const q = searchParams.get('q') || '';
        const cat = searchParams.get('category') || '';
        if (q !== searchQuery) setSearchQuery(q);
        if (cat !== selectedCategory) setSelectedCategory(cat);
    }, [searchParams]);

    const updateUrl = (q, cat) => {
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set('q', q);
        else params.delete('q');
        if (cat) params.set('category', cat);
        else params.delete('category');
        params.delete('page'); // Reset to page 1 on filter change

        const queryString = params.toString();
        router.push(`/blogs${queryString ? `?${queryString}` : ''}`, { scroll: false });
    };

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateUrl(value, selectedCategory);
        }, 400);
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        updateUrl(searchQuery, value);
    };

    return (
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
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 w-full sm:w-auto shrink-0">
                <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full sm:w-auto min-w-50 px-3 py-2.5 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
