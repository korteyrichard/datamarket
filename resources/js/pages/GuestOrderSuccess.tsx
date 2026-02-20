import { Head, Link } from '@inertiajs/react';

interface Product {
    id: number;
    name: string;
    price: number;
    network: string;
}

interface Order {
    id: number;
    total: number;
    status: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    created_at: string;
    products: Array<{
        id: number;
        name: string;
        price: number;
        network: string;
        pivot: {
            beneficiary_number: string;
        };
    }>;
}

interface GuestOrderSuccessProps {
    order: Order;
}

export default function GuestOrderSuccess({ order }: GuestOrderSuccessProps) {
    return (
        <>
            <Head title="Order Successful" />
            
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-600 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Successful!</h1>
                        <p className="text-gray-600">Your data will be delivered shortly</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-300 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order ID:</span>
                                <span className="font-semibold text-gray-900">#{order.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer Name:</span>
                                <span className="font-semibold text-gray-900">{order.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-semibold text-gray-900">{order.customer_phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-semibold text-gray-900">{order.customer_email}</span>
                            </div>
                        </div>
                    </div>

                    {order.products && order.products.length > 0 && (
                        <div className="bg-gray-50 border border-gray-300 p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
                            {order.products.map((product) => (
                                <div key={product.id} className="flex justify-between items-center mb-3 last:mb-0">
                                    <div>
                                        <div className="font-semibold text-gray-900">{product.name}</div>
                                        <div className="text-sm text-gray-600">{product.network}</div>
                                        <div className="text-sm text-gray-600">
                                            Sent to: {product.pivot.beneficiary_number}
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        GHS {product.price}
                                    </div>
                                </div>
                            ))}
                            <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Total:</span>
                                <span className="text-2xl font-bold text-gray-900">GHS {order.total}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-300 p-4 mb-6">
                        <p className="text-sm text-gray-800">
                            <strong>Note:</strong> Your data bundle will be delivered within 5-30 minutes. 
                            If you don't receive it, please contact support with your order ID.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href={route('home')}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-all"
                        >
                            Make Another Purchase
                        </Link>
                        <Link
                            href={route('register')}
                            className="flex-1 px-6 py-3 bg-white border-2 border-gray-400 text-gray-700 font-semibold text-center hover:bg-gray-100 transition-all"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
