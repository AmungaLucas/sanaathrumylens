import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import ContactForm from './ContactForm';

export const metadata = {
    title: "Contact Us | SanaaThruMyLens",
    description: "Get in touch with SanaaThruMyLens. Have a question, story idea, or want to collaborate? We would love to hear from you.",
};

export default function ContactsPage() {
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

                    {/* Contact Form - now a client component */}
                    <div className="lg:col-span-2">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
