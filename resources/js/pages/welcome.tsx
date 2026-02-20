import { type SharedData } from '@/types';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PwaInstallBanner from '@/components/PwaInstallBanner';

interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    network: string;
    status: string;
}

interface WelcomeProps {
    products: Product[];
}

export default function Welcome({ products }: WelcomeProps) {
    const { auth } = usePage<SharedData>().props;
    const [scrolled, setScrolled] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
    const [trackingData, setTrackingData] = useState({ beneficiary_number: '', paystack_reference: '' });
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: 0,
        customer_email: '',
        beneficiary_number: '',
    });

    const getCardColors = (network: string) => {
        const networkLower = network.toLowerCase();
        if (networkLower.includes('mtn')) {
            return { bg: 'bg-yellow-400', text: 'text-yellow-600', button: 'from-yellow-500 to-yellow-600' };
        } else if (networkLower.includes('telecel')) {
            return { bg: 'bg-red-500', text: 'text-red-600', button: 'from-red-500 to-red-600' };
        } else if (networkLower.includes('at')) {
            return { bg: 'bg-blue-900', text: 'text-blue-900', button: 'from-blue-900 to-blue-950' };
        }
        return { bg: 'bg-white', text: 'text-blue-600', button: 'from-blue-600 to-cyan-600' };
    };

    const handleBuyNow = (product: Product) => {
        setSelectedProduct(product);
        setData('product_id', product.id);
        setShowCheckoutModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('guest.checkout'), {
            onSuccess: () => {
                reset();
                setShowCheckoutModal(false);
            },
        });
    };

    const handleTrackOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTracking(true);
        setTrackingResult(null);

        try {
            const response = await axios.post('/guest/track-order', trackingData);
            setTrackingResult(response.data);
        } catch (error: any) {
            setTrackingResult({
                success: false,
                message: error.response?.data?.message || 'Error tracking order'
            });
        } finally {
            setIsTracking(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close nav on route change or resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setNavOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <Head title="Data Market - Make 500 Cedis or More per week Using Your Phone">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800,900" rel="stylesheet" />
            </Head>
            
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 overflow-x-hidden pb-20">
                {/* Navigation */}
                <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                    scrolled 
                        ? 'bg-white/95 backdrop-blur-lg shadow-lg' 
                        : 'bg-white/90 backdrop-blur-lg'
                } border-b border-white/20`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                Data Market
                            </div>
                            {/* Hamburger for mobile */}
                            <button
                                className="lg:hidden flex items-center px-3 py-2 border rounded text-gray-700 border-gray-300 focus:outline-none"
                                onClick={() => setNavOpen(!navOpen)}
                                aria-label="Toggle navigation"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            {/* Desktop nav */}
                            <div className="hidden lg:flex space-x-6">
                                {auth.user ? (
                                    <Link
                                        href={auth.user.role === 'admin' ? route('admin.dashboard') : route('dashboard')}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="px-6 py-2 text-gray-700 font-medium rounded-full hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            Register
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="px-6 py-2 text-gray-700 font-medium rounded-full hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            Login
                                        </Link>
                                        <a
                                            href="https://whatsapp.com/channel/0029Vb7S9eu9RZAV0rLaGU0k"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 text-gray-700 font-medium rounded-full hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            WhatsApp Group
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Mobile nav dropdown */}
                        <div className={`lg:hidden transition-all duration-300 ${navOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}> 
                            <div className="flex flex-col space-y-2 pb-4">
                                {auth.user ? (
                                    <Link
                                        href={auth.user.role === 'admin' ? route('admin.dashboard') : route('dashboard')}
                                        className="block px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                        onClick={() => setNavOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="block px-6 py-3 text-gray-700 font-medium rounded-full text-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                            onClick={() => setNavOpen(false)}
                                        >
                                            Register
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="block px-6 py-3 text-gray-700 font-medium rounded-full text-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                            onClick={() => setNavOpen(false)}
                                        >
                                            Login
                                        </Link>
                                        <a
                                            href="https://whatsapp.com/channel/0029Vb7S9eu9RZAV0rLaGU0k"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-6 py-3 text-gray-700 font-medium rounded-full text-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                                            onClick={() => setNavOpen(false)}
                                        >
                                            WhatsApp Group
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Track Order Button */}
                <div className="text-center pt-24 pb-8 px-4 flex gap-4 justify-center items-center">
                    <button
                        onClick={() => {
                            setShowTrackOrderModal(true);
                            setTrackingResult(null);
                        }}
                        className="px-6 py-2 text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        📋 Track Order
                    </button>
                    <a
                        href="https://t.me/Richie_bankx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        📞 Contact Us
                    </a>
                </div>

                {/* Products Section */}
                <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12">
                    <div className="max-w-7xl mx-auto w-full">
                        {products && products.length > 0 && (
                            <div className="text-center">
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Buy Data Now</h2>
                                <p className="text-white/80 mb-8">No registration required - Quick and easy purchase</p>
                                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {products.map((product) => {
                                        const colors = getCardColors(product.network);
                                        return (
                                            <div key={product.id} className={`${colors.bg} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1`}>
                                                <div className={`text-sm font-semibold ${colors.text} mb-2`}>{product.network}</div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                                                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                                                <div className="text-2xl font-bold text-gray-900 mb-4">GHS {product.price}</div>
                                                <button
                                                    onClick={() => handleBuyNow(product)}
                                                    className={`w-full px-4 py-3 bg-gradient-to-r ${colors.button} text-white font-semibold hover:opacity-90 transition-all`}
                                                >
                                                    Buy Now
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Checkout Modal */}
                {showCheckoutModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white max-w-md w-full p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Complete Purchase</h3>
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mb-4 p-4 bg-gray-100 border border-gray-300">
                                <div className="text-sm text-gray-700 font-semibold">{selectedProduct.network}</div>
                                <div className="text-lg font-bold text-gray-900">{selectedProduct.name}</div>
                                <div className="text-2xl font-bold text-gray-900 mt-2">GHS {selectedProduct.price}</div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                                    <input
                                        type="email"
                                        value={data.customer_email}
                                        onChange={(e) => setData('customer_email', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {errors.customer_email && <div className="text-red-500 text-sm mt-1">{errors.customer_email}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number to Receive Data</label>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        minLength={10}
                                        pattern="[0-9]{10}"
                                        value={data.beneficiary_number}
                                        onChange={(e) => setData('beneficiary_number', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0241234567"
                                        required
                                    />
                                    {errors.beneficiary_number && <div className="text-red-500 text-sm mt-1">{errors.beneficiary_number}</div>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Track Order Modal */}
                {showTrackOrderModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="relative w-full max-w-lg bg-white shadow-2xl">
                                <div className="absolute -top-3 right-4">
                                    <button
                                        onClick={() => {
                                            setShowTrackOrderModal(false);
                                            setTrackingResult(null);
                                            setTrackingData({ beneficiary_number: '', paystack_reference: '' });
                                        }}
                                        className="inline-flex h-8 w-8 items-center justify-center bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-8">
                                    <div className="text-center mb-6">
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 mb-3">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h3>
                                        <p className="text-gray-600">Enter your details to find or recover your order</p>
                                    </div>

                                    <form onSubmit={handleTrackOrder} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">📱 Beneficiary Phone Number</label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                minLength={10}
                                                pattern="[0-9]{10}"
                                                value={trackingData.beneficiary_number}
                                                onChange={(e) => setTrackingData({...trackingData, beneficiary_number: e.target.value})}
                                                placeholder="0XXXXXXXXX"
                                                className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">💳 Paystack Reference</label>
                                            <input
                                                type="text"
                                                value={trackingData.paystack_reference}
                                                onChange={(e) => setTrackingData({...trackingData, paystack_reference: e.target.value})}
                                                placeholder="Enter your payment reference (starts with 'guest')"
                                                className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 transition-colors"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">This is the reference from your payment confirmation</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setShowTrackOrderModal(false);
                                                    setTrackingResult(null);
                                                    setTrackingData({ beneficiary_number: '', paystack_reference: '' });
                                                }}
                                                className="flex-1 py-3 border border-gray-300 hover:border-gray-400 font-semibold text-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isTracking} 
                                                className="flex-1 py-3 border border-blue-500 bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
                                            >
                                                {isTracking ? '⏳ Searching...' : '🔍 Track Order'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Tracking Results */}
                                    {trackingResult && (
                                        <div className="mt-6 p-6 border">
                                            {trackingResult.success ? (
                                                trackingResult.order_found ? (
                                                    <div className="text-center">
                                                        <div className="w-12 h-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-green-800 mb-2">✅ Order Found!</h4>
                                                        <div className="text-left space-y-2">
                                                            <p><strong>Order ID:</strong> #{trackingResult.order.id}</p>
                                                            <p><strong>Status:</strong> <span className="capitalize">{trackingResult.order.status}</span></p>
                                                            <p><strong>Total:</strong> ₵{trackingResult.order.total}</p>
                                                            <p><strong>Network:</strong> {trackingResult.order.network}</p>
                                                            <p><strong>Date:</strong> {new Date(trackingResult.order.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="w-12 h-12 bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-yellow-800 mb-2">⚠ Order Not Found</h4>
                                                        <p className="text-yellow-700 mb-4">Your payment was verified but no order exists. You can proceed to create an order.</p>
                                                        <div className="text-left bg-blue-50 p-4 mb-4">
                                                            <p className="text-sm"><strong>Payment Amount:</strong> ₵{trackingResult.payment_data.amount}</p>
                                                            <p className="text-sm"><strong>Email:</strong> {trackingResult.payment_data.email}</p>
                                                            <p className="text-sm"><strong>Date:</strong> {new Date(trackingResult.payment_data.paid_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <p className="text-sm text-gray-600 text-center">Contact support or an agent to create your order</p>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-red-800 mb-2">❌ Error</h4>
                                                    <p className="text-red-700">{trackingResult.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <PwaInstallBanner />
        </>
    );
}