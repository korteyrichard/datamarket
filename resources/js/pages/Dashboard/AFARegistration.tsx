import DashboardLayout from '../../layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import React from 'react';


        export default function AfaRegistration({ auth }: PageProps) {
            return (
                <DashboardLayout
                    user={auth.user}
                    header={<h2 className="font-semibold text-xl leading-tight">AFA Registration</h2>}
                >
                    <Head title="AFA Registration" />
        
                    <div className="py-12">
                        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow-xl sm:rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6">
                                    <h1 className="text-2xl font-bold text-white mb-2">AFA Registration Portal</h1>
                                    <p className="text-purple-100">Register for the African Football Association program</p>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Registration Benefits</h3>
                                                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Official AFA membership</li>
                                                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Access to exclusive events</li>
                                                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Networking opportunities</li>
                                                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Priority support</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Coming Soon</h3>
                                                <p className="text-gray-600 dark:text-gray-300 mb-4">The AFA registration portal is currently under development. Stay tuned for updates!</p>
                                                <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300" disabled>
                                                    Registration Opening Soon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            );
        }
        
    
