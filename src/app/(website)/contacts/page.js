"use client";
import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Clock } from 'lucide-react';

export default function ContactsPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, message: '' });

        // Simulate submission (no backend endpoint yet)
        setTimeout(() => {
            setStatus({ loading: false, success: true, message: 'Thank you for reaching out! We will get back to you soon.' });
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus(null), 4000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 py-16">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
                    <p className="text-white/90 text-lg max-w-2xl mx-auto">
                        Have a question, story idea, or want to collaborate? We would love to hear from you.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-800">Email</p>
                                        <p className="text-gray-600 text-sm">hello@sanaathrumylens.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-800">Location</p>
                                        <p className="text-gray-600 text-sm">Nairobi, Kenya</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-800">Phone</p>
                                        <p className="text-gray-600 text-sm">+254 700 000 000</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-800">Response Time</p>
                                        <p className="text-gray-600 text-sm">Usually within 24-48 hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-3">What We Cover</h2>
                            <ul className="space-y-2 text-gray-600 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Architecture & Design
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Art & Culture
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Creative Community Stories
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Event Partnerships
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                    Guest Contributions
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6">Send Us a Message</h2>

                            {status?.success && (
                                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                                    {status.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                        placeholder="What is this about?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                                        placeholder="Tell us more..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={status?.loading}
                                    className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    {status?.loading ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
