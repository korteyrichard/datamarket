import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface ShopProduct {
    id: number;
    name: string;
    description: string;
    network: string;
    base_price: number;
    agent_price: number;
    product_type: string;
    status: string;
    quantity: number;
}

interface Shop {
    name: string;
    username: string;
    agent_name: string;
    color?: string;
    whatsapp_contact?: string;
}

interface PublicShopProps {
    shop: Shop;
    products: ShopProduct[];
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        }
    };
}

export default function PublicShop({ shop, products, auth }: PublicShopProps) {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
    const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
    const [trackingData, setTrackingData] = useState({ beneficiary_number: '', paystack_reference: '' });
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const { data, setData, post, processing } = useForm({
        product_id: '',
        quantity: 1,
        beneficiary_number: '',
        agent_username: shop.username,
        customer_email: '',
        customer_phone: ''
    });

    const getNetworkColor = (network: string) => {
        const colors: { [key: string]: string } = {
            'MTN': 'bg-yellow-500',
            'TELECEL': 'bg-red-500',
            'AT DATA (INSTANT)': 'bg-blue-600',
            'AT (BIG PACKAGES)': 'bg-blue-600'
        };
        return colors[network.toUpperCase()] || 'bg-gray-500';
    };

    const getNetworkCardColor = (network: string) => {
        const colors: { [key: string]: string } = {
            'MTN': 'border-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-500',
            'TELECEL': 'border-red-500 bg-gradient-to-br from-red-400 to-red-500',
            'AT DATA (INSTANT)': 'border-blue-500 bg-gradient-to-br from-blue-400 to-blue-600',
            'AT (BIG PACKAGES)': 'border-blue-500 bg-gradient-to-br from-blue-400 to-blue-600'
        };
        return colors[network.toUpperCase()] || 'border-gray-200 bg-gradient-to-br from-gray-50 to-white';
    };

    const networks = ['all', ...Array.from(new Set(products.map(p => p.network)))];
    const filteredProducts = selectedNetwork === 'all'
        ? products
        : products.filter(p => p.network === selectedNetwork);

    const handlePurchase = (product: ShopProduct) => {
        console.log('Product selected:', product);
        setSelectedProduct(product);
        // Extract number from quantity string like "2GB" -> 2
        const qty = parseInt(product.quantity.toString()) || 1;
        console.log('Setting quantity to:', qty);
        setData({
            product_id: product.id.toString(),
            quantity: qty,
            beneficiary_number: '',
            agent_username: shop.username,
            customer_email: '',
            customer_phone: ''
        });
        setShowPurchaseModal(true);
    };

    const submitPurchase = (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.user) {
            setData('customer_phone', data.beneficiary_number);
        }
        post('/shop/purchase', {
            onError: (errors) => {
                console.error('Purchase error:', errors);
            }
        });
    };

    const handleTrackOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTracking(true);
        setTrackingResult(null);

        try {
            const response = await axios.post('/shop/track-order', trackingData);
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

    const handleCreateOrderFromReference = async (productId: number) => {
        setIsCreatingOrder(true);

        try {
            const response = await axios.post('/shop/create-order-from-reference', {
                beneficiary_number: trackingData.beneficiary_number,
                paystack_reference: trackingData.paystack_reference,
                product_id: productId,
                agent_username: shop.username
            });

            if (response.data.success) {
                setTrackingResult({
                    ...trackingResult,
                    order_created: true,
                    new_order: response.data.order
                });
            } else {
                alert(response.data.message);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error creating order');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    return (
        <>
            <Head title={`${shop.name} - Data Market Agent Shop`} />

            <div
                className="min-h-screen"
                style={{
                    background: shop.color
                        ? `linear-gradient(135deg, ${shop.color}20, ${shop.color}10, #ffffff)`
                        : 'linear-gradient(135deg, #EFF6FF, #F0FDF4, #ffffff)'
                }}
            >
                <div
                    className="shadow-lg border-b border-gray-100"
                    style={{
                        backgroundColor: shop.color || '#3B82F6'
                    }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="text-center">
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                                style={{
                                    background: shop.color ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)` : 'linear-gradient(135deg, #3B82F6, #10B981)'
                                }}
                            >
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{shop.name}</h1>
                            <div
                                className="inline-flex items-center px-4 py-2 rounded-full"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                <span className="text-sm font-semibold text-white">Official Agent Shop</span>
                            </div>
                            <Button
                                onClick={() => setShowTrackOrderModal(true)}
                                className="mt-4 mr-3 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-6 py-2 rounded-full transition-all duration-300"
                            >
                                📋 Track Order
                            </Button>
                            {shop.whatsapp_contact && (
                                <Button
                                    onClick={() => {
                                        let whatsappNumber = shop.whatsapp_contact!.replace(/[^0-9]/g, '');
                                        if (whatsappNumber.startsWith('0')) {
                                            whatsappNumber = '233' + whatsappNumber.slice(1);
                                        }
                                        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello! I'm interested in your products from ${encodeURIComponent(shop.name)}.`;
                                        window.open(whatsappUrl, '_blank');
                                    }}
                                    className="mt-4 bg-green-500 hover:bg-green-600 text-white border border-green-400 font-semibold px-6 py-2 rounded-full transition-all duration-300 shadow-lg"
                                >
                                    📱 Contact Dealer
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <div className="flex flex-wrap justify-center gap-4">
                            {networks.map((network) => (
                                <button
                                    key={network}
                                    onClick={() => setSelectedNetwork(network)}
                                    className={`px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${selectedNetwork === network
                                        ? network === 'all'
                                            ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-2xl'
                                            : `${getNetworkColor(network)} text-white shadow-2xl`
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-lg'
                                        }`}
                                >
                                    {network === 'all' ? '🌐 All Networks' : `📱 ${network}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                <Card key={product.id} className={`group hover:shadow-xl transition-all duration-300 border-2 shadow-md rounded-2xl overflow-hidden transform hover:-translate-y-1 ${getNetworkCardColor(product.network)}`}>
                                    <CardHeader className="pb-2 bg-gradient-to-br from-gray-50 to-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</CardTitle>
                                            <Badge
                                                variant={product.status === 'IN STOCK' ? 'default' : 'secondary'}
                                                className={`text-xs px-2 py-1 font-semibold ${product.status === 'IN STOCK'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}
                                            >
                                                {product.status === 'IN STOCK' ? '✓ Available' : '⚠ Out of Stock'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${getNetworkColor(product.network)} shadow-sm`}></div>
                                            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">{product.network}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-1">
                                        <div className="space-y-2">
                                            <div className="text-center py-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">Price</p>
                                                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                                                    ₵{Number(product.agent_price).toFixed(2)}
                                                </p>
                                            </div>

                                            <Button
                                                className="w-full font-bold py-2 text-sm rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 text-white hover:shadow-lg"
                                                style={{
                                                    background: product.status === 'IN STOCK' && shop.color
                                                        ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                                        : product.status === 'IN STOCK'
                                                            ? 'linear-gradient(135deg, #10B981, #059669)'
                                                            : '#D1D5DB',
                                                    color: product.status !== 'IN STOCK' ? '#6B7280' : 'white'
                                                }}
                                                onClick={() => handlePurchase(product)}
                                                disabled={product.status !== 'IN STOCK'}
                                            >
                                                {product.status === 'IN STOCK' ? '💳 BUY NOW' : '⚠ OUT OF STOCK'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Products Available</h3>
                            <p className="text-gray-600 text-lg max-w-md mx-auto">
                                {selectedNetwork === 'all'
                                    ? 'This shop is currently being stocked with amazing products. Please check back soon!'
                                    : `No ${selectedNetwork} products are currently available. Try selecting a different network.`
                                }
                            </p>
                        </div>
                    )}
                </div>


            </div>

            {showPurchaseModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl transform transition-all my-8">
                            <div className="text-center mb-6">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: shop.color
                                            ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                            : 'linear-gradient(135deg, #3B82F6, #10B981)'
                                    }}
                                >
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Purchase</h3>
                                <p className="text-gray-600">{selectedProduct.name}</p>
                            </div>
                            <form onSubmit={submitPurchase} method="POST" action="/shop/purchase" className="space-y-6">
                                <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />
                                <input type="hidden" name="product_id" value={data.product_id} />
                                <input type="hidden" name="quantity" value={data.quantity} />
                                <input type="hidden" name="agent_username" value={data.agent_username} />
                                {!auth?.user && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email Address</label>
                                        <Input
                                            type="email"
                                            name="customer_email"
                                            value={data.customer_email || ''}
                                            onChange={(e) => setData('customer_email', e.target.value)}
                                            placeholder="Enter your email address"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">📱 Beneficiary Phone Number</label>
                                    <Input
                                        type="text"
                                        name="beneficiary_number"
                                        maxLength={10}
                                        minLength={10}
                                        pattern="[0-9]{10}"
                                        value={data.beneficiary_number}
                                        onChange={(e) => setData('beneficiary_number', e.target.value)}
                                        placeholder="0XXXXXXXXX"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter the phone number that will receive the data/airtime</p>
                                </div>
                                <div
                                    className="p-6 rounded-2xl border"
                                    style={{
                                        backgroundColor: shop.color ? `${shop.color}15` : '#EFF6FF',
                                        borderColor: shop.color ? `${shop.color}50` : '#BFDBFE'
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span
                                            className="font-bold text-lg"
                                            style={{ color: shop.color || '#1D4ED8' }}
                                        >
                                            💰 Order Summary
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Product:</span>
                                            <span className="font-semibold">{selectedProduct.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Network:</span>
                                            <span className="font-semibold">{selectedProduct.network}</span>
                                        </div>
                                        <div
                                            className="border-t pt-2 mt-3"
                                            style={{ borderColor: shop.color ? `${shop.color}50` : '#BFDBFE' }}
                                        >
                                            <div
                                                className="flex justify-between text-2xl font-black"
                                                style={{ color: shop.color || '#1D4ED8' }}
                                            >
                                                <span>Total:</span>
                                                <span>₵{Number(selectedProduct.agent_price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowPurchaseModal(false)}
                                        className="flex-1 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        style={{
                                            background: shop.color
                                                ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                                : 'linear-gradient(135deg, #10B981, #059669)'
                                        }}
                                    >
                                        {processing ? '⏳ Processing...' : '🚀 Place Order'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Track Order Modal */}
            {showTrackOrderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl transform transition-all my-8">
                            <div className="text-center mb-6">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{
                                        background: shop.color
                                            ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                            : 'linear-gradient(135deg, #3B82F6, #10B981)'
                                    }}
                                >
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h3>
                                <p className="text-gray-600">Enter your details to find or recover your order</p>
                            </div>

                            <form onSubmit={handleTrackOrder} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">📱 Beneficiary Phone Number</label>
                                    <Input
                                        type="text"
                                        maxLength={10}
                                        minLength={10}
                                        pattern="[0-9]{10}"
                                        value={trackingData.beneficiary_number}
                                        onChange={(e) => setTrackingData({ ...trackingData, beneficiary_number: e.target.value })}
                                        placeholder="0XXXXXXXXX"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">💳 Paystack Reference</label>
                                    <Input
                                        type="text"
                                        value={trackingData.paystack_reference}
                                        onChange={(e) => setTrackingData({ ...trackingData, paystack_reference: e.target.value })}
                                        placeholder="Enter your payment reference"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This is the reference from your payment confirmation</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowTrackOrderModal(false);
                                            setTrackingResult(null);
                                            setTrackingData({ beneficiary_number: '', paystack_reference: '' });
                                        }}
                                        className="flex-1 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isTracking}
                                        className="flex-1 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        style={{
                                            background: shop.color
                                                ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                                : 'linear-gradient(135deg, #10B981, #059669)'
                                        }}
                                    >
                                        {isTracking ? '⏳ Searching...' : '🔍 Track Order'}
                                    </Button>
                                </div>
                            </form>

                            {/* Tracking Results */}
                            {trackingResult && (
                                <div className="mt-6 p-4 rounded-2xl border">
                                    {trackingResult.success ? (
                                        trackingResult.order_found ? (
                                            // ── ORDER EXISTS ──
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                                        ) : trackingResult.order_created === true ? (
                                            // ── ORDER JUST CREATED ──
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-bold text-green-800 mb-2">✨ Order Created Successfully!</h4>
                                                <p className="text-green-700">Your order has been recovered and is now being processed.</p>
                                                <p className="text-sm text-gray-600 mt-2">Order ID: #{trackingResult.new_order?.id}</p>
                                            </div>
                                        ) : (
                                            // ── PAYMENT VERIFIED, NO ORDER — show product to create order ──
                                            <div>
                                                <div className="text-center mb-4">
                                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-yellow-800 mb-1">⚠ Order Not Found</h4>
                                                    <p className="text-yellow-700 text-sm">Payment verified — click the product below to complete your order.</p>
                                                </div>

                                                {/* Payment summary */}
                                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-sm space-y-1">
                                                    <p><strong>Payment Amount:</strong> ₵{Number(trackingResult.payment_data.amount).toFixed(2)}</p>
                                                    <p><strong>Email:</strong> {trackingResult.payment_data.email}</p>
                                                    <p><strong>Date:</strong> {new Date(trackingResult.payment_data.paid_at).toLocaleDateString()}</p>
                                                </div>

                                                {/* Product cards */}
                                                <p className="text-sm font-bold text-gray-700 mb-3">👇 Click the product to create your order:</p>
                                                {(() => {
                                                    const paidAmt = Number(trackingResult.payment_data.amount);
                                                    const exactMatches = products.filter(p => {
                                                        const price = Number(p.agent_price);
                                                        console.log('[TrackOrder] product:', p.name, 'price:', price, 'paid:', paidAmt, 'diff:', Math.abs(price - paidAmt), 'status:', p.status);
                                                        return Math.abs(price - paidAmt) <= 0.01 && p.status === 'IN STOCK';
                                                    });
                                                    const inStockProducts = exactMatches;
                                                    const isExact = true;

                                                    if (inStockProducts.length === 0) {
                                                        return (
                                                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                                                                <p className="text-orange-700 font-semibold text-sm">⚠ No products found matching your payment amount of ₵{paidAmt.toFixed(2)}.</p>
                                                                <p className="text-orange-600 text-xs mt-1">Please contact the shop agent for assistance.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-3">
                                                            {inStockProducts.map((product) => (
                                                                <div
                                                                    key={product.id}
                                                                    className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] border-2 border-green-400 bg-gradient-to-br from-green-50 to-white"
                                                                    onClick={() => !isCreatingOrder && handleCreateOrderFromReference(product.id)}
                                                                >
                                                                    <div className="bg-green-500 px-4 py-1.5 text-center">
                                                                        <span className="text-white text-xs font-bold tracking-wide">✓ MATCHES YOUR PAYMENT OF ₵{paidAmt.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="p-4">
                                                                        <div className="flex items-start justify-between mb-3">
                                                                            <div>
                                                                                <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
                                                                                <p className="text-sm text-gray-500 font-medium mt-0.5">{product.network}</p>
                                                                            </div>
                                                                            <span className="text-2xl font-black text-green-600">
                                                                                ₵{Number(product.agent_price).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <Button
                                                                            onClick={(e) => { e.stopPropagation(); handleCreateOrderFromReference(product.id); }}
                                                                            disabled={isCreatingOrder}
                                                                            className="w-full text-white font-bold py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base"
                                                                            style={{
                                                                                background: shop.color
                                                                                    ? `linear-gradient(135deg, ${shop.color}, ${shop.color}dd)`
                                                                                    : 'linear-gradient(135deg, #10B981, #059669)'
                                                                            }}
                                                                        >
                                                                            {isCreatingOrder ? '⏳ Creating Order...' : '🛒 Create Order'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )
                                    ) : (
                                        // ── ERROR ──
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            )}
        </>
    );
}