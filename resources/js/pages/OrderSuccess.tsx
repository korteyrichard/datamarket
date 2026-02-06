import React from 'react';
import { Head } from '@inertiajs/react';

interface Order {
    id: number;
    total: number;
    status: string;
    beneficiary_number: string;
    network: string;
    customer_name: string;
    customer_phone: string;
    products: Array<{
        id: number;
        name: string;
        pivot: {
            quantity: number;
            price: number;
            beneficiary_number: string;
        };
    }>;
}

interface Props {
    order: Order;
}

export default function OrderSuccess({ order }: Props) {
    return (
        <>
            <Head title="Order Success" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-green-600">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Order Successful!
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Your order has been placed successfully
                        </p>
                    </div>
                    
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order ID:</span>
                                <span className="font-medium">#{order.id}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-medium">GH₵{order.total}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium capitalize">{order.status}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Beneficiary:</span>
                                <span className="font-medium">{order.beneficiary_number}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Network:</span>
                                <span className="font-medium">{order.network}</span>
                            </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                You will receive your data/airtime shortly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}