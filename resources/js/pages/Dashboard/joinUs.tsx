import DashboardLayout from '../../layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export default function JoinUs({ auth }: PageProps) {
    return (
        <DashboardLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Join Us
                </h2>
            }
        >
            <Head title="Join Us" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        {/* WhatsApp Card */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-8 rounded-xl shadow-lg border border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-300 max-w-md w-full">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-full shadow-lg">
                                    <FaWhatsapp className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    WhatsApp Community
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                Join our vibrant WhatsApp community to stay updated with the latest news, tips, and connect with other users.
                            </p>
                            <a
                                href="https://whatsapp.com/channel/0029Vb7S9eu9RZAV0rLaGU0k"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                                <span className="mr-2">↗</span> Join WhatsApp Community
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
