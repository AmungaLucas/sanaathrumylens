"use client";
import { Grid, List } from 'lucide-react';

export default function ViewToggle({ initialMode = 'grid' }) {
    // For now, always default to grid. Can add localStorage persistence later.
    // This component exists as a placeholder — the view mode is not persisted
    // because with server rendering, changing view mode would require URL params
    // or a full re-render. Grid-only is cleaner for SEO.
    return null;

    // If view toggle is needed in the future, uncomment and add ?view=grid|list to URL
    /*
    const [viewMode, setViewMode] = useState(initialMode);

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Grid view"
            >
                <Grid size={18} />
            </button>
            <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="List view"
            >
                <List size={18} />
            </button>
        </div>
    );
    */
}
