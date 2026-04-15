//src/app/blogs/[slug]/_components/SubscriptionForm.js

"use client";
import { useState } from "react";
// Newsletter subscription via API
import { SectionTitle } from "./SectionTitle";

export default function SubscriptionForm() {
    const [email, setEmail] = useState("");
    const [subscriptionStatus, setSubscriptionStatus] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setSubscriptionStatus({
                success: false,
                message: "Please enter a valid email",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            setSubscriptionStatus(result);
            if (result.success) {
                setEmail("");
            }
        } catch (error) {
            setSubscriptionStatus({
                success: false,
                message: "Subscription failed. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-4">
            <SectionTitle>Stay Inspired</SectionTitle>
            <form onSubmit={handleSubscribe}>
                <input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs mb-3 focus:outline-none focus:border-gray-400"
                    required
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Subscribing..." : "Subscribe"}
                </button>
            </form>
            {subscriptionStatus.message && (
                <p
                    className={`text-xs mt-2 ${subscriptionStatus.success
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                >
                    {subscriptionStatus.message}
                </p>
            )}
        </div>
    );
}