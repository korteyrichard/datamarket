import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface AgentUpgradeProps {
    existingReferralCode?: string;
    userRole?: string;
}

export default function BecomeAnAgent({ existingReferralCode, userRole }: AgentUpgradeProps) {
    const { flash } = usePage().props as any;
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        referrer_code: existingReferralCode || ''
    });

    const isAgent = userRole === 'agent';
    const isCustomer = userRole === 'customer';
    const price = isAgent ? 30 : 30;

    // Handle Paystack redirect
    useEffect(() => {
        if (flash?.paystack_url) {
            window.location.href = flash.paystack_url;
        }
    }, [flash]);

    const handleBecomeAgent = (e: React.FormEvent) => {
        e.preventDefault();
        post('/become-a-dealer');
    };

    return (
        <>
            <Head title={isAgent ? "Become a Data Market Dealer" : "Become a Data Market Dealer"} />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 px-4 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-2xl w-full space-y-6 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white text-center">
                        {isAgent ? 'Become a Data Market Dealer' : 'Become a Data Market Dealer'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg text-center leading-relaxed">
                        {isAgent 
                            ? 'Upgrade to dealer status and unlock advanced features with referral and commission systems.'
                            : 'Create your own mini shop using your business name and start earning commissions on every sale as a Data Market dealer.'
                        }
                    </p>
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center">
                        <p className="text-blue-800 dark:text-blue-200 font-bold text-xl">
                            Data Market Dealer {isAgent ? 'Upgrade' : 'Registration'} Fee: GHS {price}
                        </p>
                        <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                            {isAgent 
                                ? 'Special pricing for existing agents'
                                : 'One-time payment to activate your Data Market dealer account'
                            }
                        </p>

                    </div>

                    <form onSubmit={handleBecomeAgent} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Username (for your shop URL)
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="e.g., johndatashop"
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Your shop will be available at: /shop/{data.username || 'username'}
                            </p>
                            {errors.username && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.username}</p>}
                        </div>

                        {isCustomer && (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Referrer Code (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={data.referrer_code}
                                    onChange={(e) => setData('referrer_code', e.target.value)}
                                    placeholder="Enter referrer's code if you have one"
                                />
                                {errors.referrer_code && <p className="text-red-500 dark:text-red-400 text-sm font-medium">{errors.referrer_code}</p>}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                        >
                            {processing 
                                ? 'Processing Payment...' 
                                : `Pay GHS ${price} & Become a Data Market Dealer`
                            }
                        </button>
                        {errors.message && <p className="text-red-500 dark:text-red-400 text-sm mt-3 text-center font-medium">{errors.message}</p>}
                    </form>
                </div>
            </div>
        </>
    );
}