import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [scrolled, setScrolled] = useState(false);
    const [navOpen, setNavOpen] = useState(false); // Mobile nav state

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

                {/* Hero Section */}
                <section className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-20">
                    <div className="max-w-6xl mx-auto z-10 relative">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Start Your Own{' '}
                            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                                Data Business
                            </span>
                            {' '}Today
                        </h1>
                        <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Create your personalized shop, sell data, and earn commissions on every sale
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            {auth.user ? (
                                <Link
                                    href={auth.user.role === 'admin' ? route('admin.dashboard') : route('dashboard')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('register')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105"
                                >
                                    Start Earning Today
                                </Link>
                            )}
                        </div>

                        {/* Features Grid */}
                        <div id="features" className="grid md:grid-cols-3 gap-6 mt-16">
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Your Own Shop</h3>
                                <p className="text-white/80 leading-relaxed">
                                    Get a personalized shop with your business name. Customize colors and share your unique link with customers.
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Earn Commissions</h3>
                                <p className="text-white/80 leading-relaxed">
                                    Make money on every sale. Track your earnings in real-time and withdraw anytime to your mobile money account.
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Instant Delivery</h3>
                                <p className="text-white/80 leading-relaxed">
                                    All orders are processed instantly. Your customers receive their data immediately after payment.
                                </p>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="mt-20">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">How It Works</h2>
                            <div className="grid md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mx-auto mb-4">1</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Register</h4>
                                    <p className="text-white/70">Create your free account in seconds</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mx-auto mb-4">2</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Setup Shop</h4>
                                    <p className="text-white/70">Upgrade to dealer and customize your shop</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mx-auto mb-4">3</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Share Link</h4>
                                    <p className="text-white/70">Share your shop link with customers</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mx-auto mb-4">4</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Earn Money</h4>
                                    <p className="text-white/70">Get paid for every successful sale</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </>
    );
}