//src/app/blogs/[slug]/_components/ArticlesByAuthor.js

"use client";
import Image from "next/image";
import Link from "next/link";
import StoryMeta from "./BlogStats";
import { SectionTitle } from "./SectionTitle";

export default function ArticlesByAuthor({ articles, authorName = "This Author" }) {
    if (!articles || articles.length === 0) return null;

    return (
        <div className="bg-white rounded-lg p-4 mb-4">
            <SectionTitle>
                Articles by {authorName}
            </SectionTitle>
            {articles.map((article, idx) => (
                <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                    <Link
                        href={`/blogs/${article.slug || article.id}`}
                        className="relative w-14 h-14 rounded shrink-0 overflow-hidden block"
                    >
                        {article.featuredImage ? (
                            <Image
                                src={article.featuredImage}
                                alt={`${article.title} — Thumbnail`}
                                fill
                                className="object-cover"
                                sizes="56px"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400"></div>
                        )}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/blogs/${article.slug || article.id}`}>
                            <h4 className="text-xs font-semibold mb-1 leading-tight line-clamp-2 hover:text-blue-600">
                                {article.title}
                            </h4>
                        </Link>
                        <StoryMeta
                            views={article.stats?.views || 0}
                            likes={article.stats?.likes || 0}
                            comments={article.stats?.comments || 0}
                            iconSize={10}
                            textSize="text-xs"
                        />
                        <Link
                            href={`/blogs/${article.slug || article.id}`}
                            className="text-blue-600 text-xs hover:underline mt-1 inline-block"
                        >
                            {`Read more about ${article.title}`}
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}