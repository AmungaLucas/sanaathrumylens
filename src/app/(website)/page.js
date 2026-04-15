import { generateHomeMetadata } from '../seo/meta';
import { SITE_NAME, SITE_URL } from '../seo/constants';
import { cookies } from 'next/headers';
import HomeClientPage from './HomeClientPage';

export const metadata = generateHomeMetadata();

export default async function HomePage() {
    // Force dynamic rendering — cookies() is a dynamic API that
    // prevents SSG, avoiding hydration mismatches that break client-side navigation
    await cookies();

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_NAME,
        'url': SITE_URL,
        'description': 'High-quality articles, insights, and updates on architecture, design, and technology.',
        'potentialAction': {
            '@type': 'SearchAction',
            'target': `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData)
                }}
            />
            <HomeClientPage
                siteUrl={SITE_URL}
                siteName={SITE_NAME}
            />
        </>
    );
}
