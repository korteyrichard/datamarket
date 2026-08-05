import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

interface MashupPackage {
    id: number;
    name: string;
    size: string;
    price: number;
}

interface Props {
    packages: MashupPackage[];
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

export default function GuestMashup() {
    const { packages, flash } = usePage<Props>().props;
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [trackRef, setTrackRef] = useState('');
    const [trackResult, setTrackResult] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        mashup_package_id: '',
        beneficiary_number: '',
        customer_email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guest.mashup.checkout'));
    };

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTracking(true);
        setTrackResult(null);
        try {
            const res = await axios.post('/mashup/track', { paystack_reference: trackRef });
            setTrackResult(res.data);
        } catch (err: any) {
            setTrackResult({ success: false, message: err.response?.data?.message || 'Error tracking order' });
        } finally {
            setIsTracking(false);
        }
    };

    return (
        <>
            <Head title="Mashup Packages - Data Market" />
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 pb-20">
                {/* Nav */}
                <nav className="bg-white/90 backdrop-blur-lg shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                        <Link href="/" className="text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Data Market
                        </Link>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowTrackModal(true); setTrackResult(null); }}
                                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 text-sm"
                            >
                                📋 Track Order
                            </button>
                            <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 text-sm">
                                ← Back Home
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Flash */}
                <div className="max-w-4xl mx-auto px-4 pt-8">
                    {flash?.success && <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-4">{flash.success}</div>}
                    {flash?.error && <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">{flash.error}</div>}
                </div>

                {/* Hero */}
                <div className="text-center pt-12 pb-8 px-4">
                    <h1 className="text-4xl font-bold text-white mb-2">Mashup Packages</h1>
                    <p className="text-white/80">Data + Minutes combos — No registration required</p>
                </div>

                {/* Order Form */}
                <section className="max-w-xl mx-auto px-4 mb-12">
                    <div className="bg-white rounded-2xl shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Place Mashup Order</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                                <select
                                    value={data.mashup_package_id}
                                    onChange={e => setData('mashup_package_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select a package</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} — {pkg.size} (GHS {pkg.price})
                                        </option>
                                    ))}
                                </select>
                                {errors.mashup_package_id && <p className="text-red-500 text-xs mt-1">{errors.mashup_package_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Number</label>
                                <input
                                    type="text"
                                    value={data.beneficiary_number}
                                    onChange={e => setData('beneficiary_number', e.target.value)}
                                    placeholder="0551234567"
                                    maxLength={10}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                {errors.beneficiary_number && <p className="text-red-500 text-xs mt-1">{errors.beneficiary_number}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                                <input
                                    type="email"
                                    value={data.customer_email}
                                    onChange={e => setData('customer_email', e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Proceed to Payment'}
                            </button>
                        </form>
                    </div>
                </section>


            </div>

            {/* Track Modal */}
            {showTrackModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Track Mashup Order</h3>
                            <button onClick={() => setShowTrackModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleTrack} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Paystack Reference</label>
                                <input
                                    type="text"
                                    value={trackRef}
                                    onChange={e => setTrackRef(e.target.value)}
                                    placeholder="mashup_xxxxxxxxxx_05xxxxxxxx"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Must start with "mashup_"</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isTracking}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isTracking ? '⏳ Searching...' : '🔍 Track Order'}
                            </button>
                        </form>

                        {trackResult && (
                            <div className="mt-4 p-4 border rounded-lg">
                                {trackResult.success && trackResult.order_found ? (
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-2">✅ Order Found</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Order ID:</strong> #{trackResult.order.id}</p>
                                            <p><strong>Package:</strong> {trackResult.order.package_name} ({trackResult.order.package_size})</p>
                                            <p><strong>Number:</strong> {trackResult.order.beneficiary_number}</p>
                                            <p><strong>Amount:</strong> GHS {trackResult.order.amount}</p>
                                            <p><strong>Status:</strong> <span className="capitalize">{trackResult.order.status}</span></p>
                                            <p><strong>Date:</strong> {new Date(trackResult.order.created_at).toLocaleDateString()}</p>
                                        </div>
                                        {trackResult.message && <p className="text-green-600 text-sm mt-2">{trackResult.message}</p>}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h4 className="font-bold text-red-800 mb-1">❌ {trackResult.message || 'Order not found'}</h4>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
