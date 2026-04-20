//src/app/blogs/[slug]/_components/AuthorBio.js
"use client";
import Image from "next/image";
import Link from "next/link";
import { SectionTitle } from "./SectionTitle";

export default function AuthorBio({ author }) {
    if (!author) return null;

    const { name, avatar, description, bio, socials } = author;

    return (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
            {/* Author Avatar */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
                <Image
                    src={avatar || "/default-avatar.png"}
                    alt={`Avatar of ${name}`}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    loading="lazy"
                />
                <h3 className="font-bold text-lg mb-1 pt-1.5">
                    {name}
                </h3>
            </div>

            {/* Author Info */}
            <div className="md:col-span-3">
                <p className="text-sm text-gray-700">
                    {description || bio || "Creative writer and storyteller."}
                </p>

                {/* Social Links */}
                {socials && Object.keys(socials).length > 0 && (
                    <ul className="flex gap-3 mt-3">
                        {Object.entries(socials).map(
                            ([key, url]) => (
                                <li key={key}>
                                    <Link
                                        href={url}
                                        className={`text-sm text-gray-500 hover:${key === "twitter"
                                            ? "text-blue-400"
                                            : key === "instagram"
                                                ? "text-pink-600"
                                                : "text-blue-600"
                                            }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </Link>
                                </li>
                            )
                        )}
                    </ul>
                )}
            </div>
        </section>
    );
}