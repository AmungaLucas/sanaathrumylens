'use client';

import { useState } from 'react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState(null);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setSubscribeStatus({ loading: true, message: '' });

        try {
            const res = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();

            setSubscribeStatus({
                loading: false,
                success: result.success,
                message: result.message || (result.success ? 'Subscribed successfully!' : 'Failed to subscribe.'),
            });

            if (result.success) {
                setEmail('');
                setTimeout(() => setSubscribeStatus(null), 3000);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setSubscribeStatus({
                loading: false,
                success: false,
                message: 'Failed to subscribe. Please try again.',
            });
        }
    };

    return (
        <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-2">Stay on the Lens</h3>
            <p className="text-xs text-gray-600 mb-4">Get essays, reviews, and creative commentary delivered straight to your inbox—when it matters.</p>

            <form onSubmit={handleSubscribe}>
                <input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    disabled={subscribeStatus?.loading}
                >
                    {subscribeStatus?.loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Subscribing...
                        </span>
                    ) : 'Subscribe'}
                </button>

                {subscribeStatus && (
                    <p className={`text-xs mt-2 text-center ${subscribeStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                        {subscribeStatus.message}
                    </p>
                )}

                <p className="text-xs text-gray-500 mt-2 text-center">By subscribing you agree to our terms and conditions.</p>
            </form>
        </div>
    );
}
