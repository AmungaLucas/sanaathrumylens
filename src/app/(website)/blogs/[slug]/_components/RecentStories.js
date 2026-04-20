//src/app/blogs/[slug]/_components/RecentStories.js

"use client";
import Image from "next/image";
import Link from "next/link";
import StoryMeta from "./BlogStats";
import { SectionTitle } from "./SectionTitle";

export default function RecentStories({ stories }) {
    if (!stories || stories.length === 0) return null;

    return (
        <div className="bg-white  rounded-lg p-4 mb-4">
            <SectionTitle>Recent Stories</SectionTitle>
            {stories.map((story, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                    <div className="flex gap-3 group">
                        {/* Story Image */}
                        <Link
                            href={`/blogs/${story.slug || story.id}`}
                            className="relative w-14 h-14 rounded shrink-0 overflow-hidden block"
                        >
                            {story.featuredImage ? (
                                <Image
                                    src={story.featuredImage}
                                    alt={`${story.title} — Thumbnail`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="56px"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">
                                        No image
                                    </span>
                                </div>
                            )}
                        </Link>

                        {/* Story Content */}
                        <div className="flex-1 min-w-0">
                            <Link href={`/blogs/${story.slug || story.id}`}>
                                <h4 className="text-xs font-semibold mb-1 leading-tight hover:text-blue-600 line-clamp-2">
                                    {story.title}
                                </h4>
                            </Link>
                            <StoryMeta
                                views={story.stats?.views || 0}
                                likes={story.stats?.likes || 0}
                                comments={story.stats?.comments || 0}
                                iconSize={10}
                                textSize="text-xs"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}