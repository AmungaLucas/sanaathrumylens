//src/app/blogs/[slug]/_components/RelatedArticles.js

"use client";
import Image from "next/image";
import Link from "next/link";
import StoryMeta from "./BlogStats";

export default function RelatedArticles({ articles, categories = [] }) {
    if (!articles || articles.length === 0) return null;

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-2">Related Articles</h2>
            <p className="text-gray-600 text-sm mb-6">
                Explore more articles on similar topics
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article, idx) => (
                    <Link
                        key={idx}
                        href={`/blogs/${article.slug || article.id}`}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                        prefetch={false}
                    >
                        <div className="relative aspect-video overflow-hidden">
                            {article.featuredImage ? (
                                <Image
                                    src={article.featuredImage}
                                    alt={`${article.title} — Featured image`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-400"></div>
                            )}
                        </div>
                        <div className="p-1.5">
                            <div className="text-xs text-gray-500 mb-0.5">
                                {formatDate(article.publishedAt)}
                            </div>
                            <h3 className="font-bold text-sm mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-sm mb-1.5 line-clamp-2">
                                {article.excerpt}
                            </p>
                            <div className="mb-2">
                                <StoryMeta
                                    views={article.stats?.views || 0}
                                    likes={article.stats?.likes || 0}
                                    comments={article.stats?.comments || 0}
                                    iconSize={10}
                                    textSize="text-xs"
                                />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}