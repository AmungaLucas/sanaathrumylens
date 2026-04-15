import Link from 'next/link';
import { query, initDatabase } from '@/lib/db';

export const revalidate = 3600; // Revalidate every hour

async function ensureDb() {
    return await initDatabase();
}

async function getAuthors() {
    try {
        const dbOk = await ensureDb();
        if (!dbOk) return [];
        const rows = await query('SELECT id, slug, name, bio, avatar, created_at, updated_at FROM authors ORDER BY name ASC');
        return Array.isArray(rows) ? rows.map((row) => ({
            id: row.id,
            slug: row.slug,
            name: row.name,
            bio: row.bio,
            avatar: row.avatar,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        })) : [];
    } catch (error) {
        console.error('Error fetching authors:', error);
        throw new Error('Failed to fetch authors');
    }
}

export default async function AuthorsIndex() {
    const dbOk = await ensureDb();
    if (!dbOk) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#f5f1e8]">
                <div className="text-center">
                    <p className="text-gray-500">Service temporarily unavailable. Please try again later.</p>
                </div>
            </div>
        );
    }

    let authors;

    try {
        authors = await getAuthors();
    } catch (error) {
        return (
            <main className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-4">Authors</h1>
                <p className="text-red-600">Failed to load authors.</p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="mt-4 p-4 bg-gray-100 text-sm overflow-auto">
                        {error?.message || 'Unknown error'}
                    </pre>
                )}
            </main>
        );
    }

    if (!authors || authors.length === 0) {
        return (
            <main className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Authors</h1>
                <p className="text-gray-500">No authors found.</p>
            </main>
        );
    }

    return (
        <main className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Authors</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authors.map(author => (
                    <Link
                        key={author.id}
                        href={`/author/${author.slug || author.id}`}
                        className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`View ${author.name}'s profile`}
                    >
                        <h2 className="text-lg font-semibold">{author.name}</h2>
                        {author.bio && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {author.bio}
                            </p>
                        )}
                    </Link>
                ))}
            </div>
        </main>
    );
}
