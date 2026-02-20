import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import axios from '@/lib/axios';

interface DashboardStats {
    total_commissions: number;
    available_commissions: number;
    pending_commissions: number;
    total_referrals: number;
    referral_earnings: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    network: string;
    status: string;
}

interface AgentProduct {
    id: number;
    agent_price: number;
    product: Product;
}

interface AgentDashboardProps extends PageProps {
    dashboardData: DashboardStats;
    agentProducts: AgentProduct[];
    availableProducts: Product[];
    shopUrl: string;
}

export default function AgentDashboard({ auth, dashboardData, agentProducts, availableProducts, shopUrl }: AgentDashboardProps) {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [agentPrice, setAgentPrice] = useState('');
    const [copied, setCopied] = useState(false);
    
    const { delete: destroy, processing } = useForm();

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shopUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const shareShop = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Shop',
                    text: 'Check out my shop for great deals!',
                    url: shopUrl,
                });
            } catch (err) {
                console.error('Error sharing: ', err);
            }
        } else {
            copyToClipboard();
        }
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedProduct || !agentPrice) {
            return;
        }
        
        const formData = new FormData();
        formData.append('product_id', selectedProduct);
        formData.append('agent_price', agentPrice);
        
        axios.post('/dealer/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
        .then(response => {
            if (response.status === 200 || response.status === 201) {
                setSelectedProduct('');
                setAgentPrice('');
                window.location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    };

    const handleRemoveProduct = (productId: number) => {
        destroy(`/dealer/products/${productId}`);
    };
    return (
        <DashboardLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Dealer Dashboard
                </h2>
            }
        >
            <Head title="Dealer Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Welcome Message */}
                    <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
                        <CardContent className="pt-6">
                            <h3 className="text-lg font-semibold mb-2">Welcome back, {auth.user.name}!</h3>
                            <p className="text-white/90">Here's an overview of your dealer performance.</p>
                        </CardContent>
                    </Card>

                    {/* Shop URL Section */}
                    <Card className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 text-white border-0 shadow-xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-white">Your Shop URL</CardTitle>
                                <Button 
                                    onClick={() => window.location.href = '/dealer/shop/edit'}
                                    variant="outline"
                                    size="sm"
                                    className="bg-white text-black border-white/30 hover:bg-white/90"
                                >
                                    Edit Shop
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <Input 
                                        value={shopUrl} 
                                        readOnly 
                                        className="flex-1 text-xs sm:text-sm bg-white text-black"
                                    />
                                    <div className="flex gap-2">
                                        <Button 
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 sm:flex-none bg-white text-black border-white/30 hover:bg-white/90"
                                        >
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                        <Button 
                                            onClick={shareShop}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 sm:flex-none bg-white text-black border-white/30 hover:bg-white/90"
                                        >
                                            Share
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-black/80">
                                    Share this link with customers so they can buy from your shop
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium text-white/90">Total Earnings</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl sm:text-2xl font-bold">GHS {(Number(dashboardData?.total_commissions) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">Sales + referrals</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium text-white/90">Available Balance</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl sm:text-2xl font-bold">GHS {(Number(dashboardData?.available_commissions) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">Ready to withdraw</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium text-white/90">Sales Commissions</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl sm:text-2xl font-bold">GHS {(Number(dashboardData?.total_sales) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">From product sales</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium text-white/90">Referral Earnings</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-xl sm:text-2xl font-bold">GHS {(Number(dashboardData?.referral_earnings) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">{dashboardData?.total_referrals || 0} referrals</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shop Products Management */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Add Product to Shop</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddProduct} className="space-y-4">
                                    <div>
                                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                            <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300">
                                                <SelectValue placeholder="Select a product" className="text-gray-500" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableProducts?.map((product) => (
                                                    <SelectItem key={product.id} value={product.id.toString()}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className="text-sm text-gray-500">GHS {product.price} ({product.network})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {availableProducts?.length === 0 && (
                                            <p className="text-sm text-gray-500 mt-1">No products available to add</p>
                                        )}
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Your selling price"
                                            value={agentPrice}
                                            onChange={(e) => setAgentPrice(e.target.value)}
                                            className="w-full"
                                        />
                                        {selectedProduct && availableProducts && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Base price: GHS {availableProducts.find(p => p.id.toString() === selectedProduct)?.price || 0}
                                            </p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={!selectedProduct || !agentPrice} className="w-full sm:w-auto">
                                        {processing ? 'Adding...' : 'Add Product'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-teal-500 via-green-500 to-emerald-500 text-white border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Your Shop Products</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {agentProducts?.map((agentProduct) => (
                                        <div key={agentProduct.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 border rounded">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm sm:text-base">{agentProduct.product.name}</div>
                                                <div className="text-xs sm:text-sm text-gray-500">
                                                    Base: GHS {agentProduct.product.price} | Your Price: GHS {agentProduct.agent_price}
                                                </div>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveProduct(agentProduct.product.id)}
                                                disabled={processing}
                                                className="w-full sm:w-auto"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                    {(!agentProducts || agentProducts.length === 0) && (
                                        <p className="text-gray-500 text-center py-4">No products in your shop yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Summary */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 text-white border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Commission Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-white/90">Total Earned:</span>
                                        <span className="font-semibold text-white">GHS {(Number(dashboardData?.total_commissions) || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/90">Available:</span>
                                        <span className="font-semibold text-white">GHS {(Number(dashboardData?.available_commissions) || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 text-white border-0 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Referral Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-white/90">Total Referrals:</span>
                                        <span className="font-semibold text-white">{dashboardData?.total_referrals || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/90">Referral Earnings:</span>
                                        <span className="font-semibold text-white">GHS {(Number(dashboardData?.referral_earnings) || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/90">Avg per Referral:</span>
                                        <span className="font-semibold text-white">
                                            GHS {(Number(dashboardData?.total_referrals) || 0) > 0 ? ((Number(dashboardData?.referral_earnings) || 0) / (Number(dashboardData?.total_referrals) || 1)).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}