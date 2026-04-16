"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';

const categories = ["all", "Technology", "Business", "Arts & Culture", "Sports", "Community", "Entertainment", "Education"];
const eventTypes = ["all", "online", "in-person"];

export default function EventsFilterBar({ initialSearch = '', initialCategory = 'all', initialType = 'all', initialShowPast = false }) {
    const [search, setSearch] = useState(initialSearch);
    const [category, setCategory] = useState(initialCategory);
    const [selectedType, setSelectedType] = useState(initialType);
    const debounceRef = useRef(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Sync with URL params (e.g. browser back/forward)
        const q = searchParams.get('q') || '';
        const cat = searchParams.get('category') || 'all';
        const type = searchParams.get('type') || 'all';
        if (q !== search) setSearch(q);
        if (cat !== category) setCategory(cat);
        if (type !== selectedType) setSelectedType(type);
    }, [searchParams]);

    const updateUrl = (q, cat, type) => {
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set('q', q);
        else params.delete('q');
        if (cat && cat !== 'all') params.set('category', cat);
        else params.delete('category');
        if (type && type !== 'all') params.set('type', type);
        else params.delete('type');
        params.delete('page');

        const queryString = params.toString();
        router.push(`/events${queryString ? `?${queryString}` : ''}`, { scroll: false });
    };

    const handleSearchChange = (value) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateUrl(value, category, selectedType);
        }, 400);
    };

    const handleCategoryChange = (value) => {
        setCategory(value);
        updateUrl(search, value, selectedType);
    };

    const handleTypeChange = (value) => {
        setSelectedType(value);
        updateUrl(search, category, value);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('all');
        setSelectedType('all');
        router.push('/events', { scroll: false });
    };

    const hasFilters = search || category !== 'all' || selectedType !== 'all';

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                    />
                    <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B5E55]" />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full md:w-48 px-4 py-3 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] w-4 h-4 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <select
                            value={selectedType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="w-full md:w-40 px-4 py-3 rounded-lg border border-[#F5F1EB] focus:outline-none focus:border-[#6B8E23] focus:ring-1 focus:ring-[#6B8E23]"
                        >
                            {eventTypes.map(type => (
                                <option key={type} value={type}>
                                    {type === 'all' ? 'All Types' : type === 'online' ? 'Online' : 'In-Person'}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] w-4 h-4 pointer-events-none" />
                    </div>
                </div>
            </div>

            {hasFilters && (
                <div className="mt-4 pt-4 border-t border-[#F5F1EB]">
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#F5F1EB] text-[#6B5E55] hover:bg-[#F0E8D9]"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}
