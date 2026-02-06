import { Head, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Commission {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    available_at?: string;
    agent: {
        name: string;
        email: string;
    };
    order: {
        id: number;
        total: number;
    };
}

interface ReferralCommission {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    available_at?: string;
    type: string;
    referrer: {
        name: string;
        email: string;
    };
}

interface AdminCommissionsProps extends PageProps {
    commissions: {
        data: Commission[];
        current_page: number;
        last_page: number;
        total: number;
    };
    referralCommissions: {
        data: ReferralCommission[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filterStatus: string;
    agents: Array<{ id: number; name: string; email: string }>;
    
    // Order/Sales Commission Data
    totalOrderCommissions: number;
    availableOrderCommissions: number;
    pendingOrderCommissions: number;
    paidOrderCommissions: number;
    withdrawnOrderCommissions: number;
    totalCommissionCount: number;
    availableCommissionCount: number;
    pendingCommissionCount: number;
    paidCommissionCount: number;
    withdrawnCommissionCount: number;
    
    // Referral Commission Data
    totalReferralCommissions: number;
    availableReferralCommissions: number;
    pendingReferralCommissions: number;
    withdrawnReferralCommissions: number;
    totalReferralCount: number;
    availableReferralCount: number;
    pendingReferralCount: number;
    withdrawnReferralCount: number;
    
    // Combined Totals
    totalAvailableCommissions: number;
    totalAllCommissions: number;
}

export default function AdminCommissions(props: AdminCommissionsProps) {
    const { 
        auth, 
        commissions, 
        referralCommissions,
        filterStatus
    } = props;
    

    const { post, processing } = useForm();
    const [activeTab, setActiveTab] = useState('orders');

    const makeAvailable = (commissionId: number) => {
        post(`/admin/commissions/${commissionId}/available`);
    };
    
    const makeReferralAvailable = (referralCommissionId: number) => {
        post(`/admin/referral-commissions/${referralCommissionId}/available`);
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            available: 'bg-green-100 text-green-800',
            withdrawn: 'bg-gray-100 text-gray-800'
        };

        return (
            <Badge className={colors[status as keyof typeof colors]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <AdminLayout user={auth.user} header="Commission Management">
            <Head title="Admin - Commissions" />

            <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total All Commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">GHS {Number(props.totalCommissions || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Orders only</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                GHS {Number(props.totalAvailableCommissions || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Order Commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{props.totalCommissionCount}</div>
                            <p className="text-xs text-muted-foreground">GHS {Number(props.totalOrderCommissions || 0).toFixed(2)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Referral Commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{props.totalReferralCount}</div>
                            <p className="text-xs text-muted-foreground">GHS {Number(props.totalReferralCommissions || 0).toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'orders'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Order/Sales Commissions
                    </button>
                    <button
                        onClick={() => setActiveTab('referrals')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'referrals'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Referral Commissions
                    </button>
                </div>
                
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Order Commission Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold">{props.totalCommissionCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.totalCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Available</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-green-600">{props.availableCommissionCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.totalAvailableCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-yellow-600">{props.pendingCommissionCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.totalPendingCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-gray-600">{props.withdrawnCommissionCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.totalWithdrawnCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Commissions Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order/Sales Commissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Agent</th>
                                                <th className="text-left p-2">Order ID</th>
                                                <th className="text-left p-2">Commission</th>
                                                <th className="text-left p-2">Status</th>
                                                <th className="text-left p-2">Created</th>
                                                <th className="text-left p-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commissions.data.map((commission) => (
                                                <tr key={commission.id} className="border-b">
                                                    <td className="p-2">
                                                        <div>
                                                            <div className="font-medium">{commission.agent.name}</div>
                                                            <div className="text-sm text-gray-500">{commission.agent.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="font-mono text-sm">#{commission.order.id}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Order: GHS {commission.order.total}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 font-semibold">GHS {commission.amount}</td>
                                                    <td className="p-2">{getStatusBadge(commission.status)}</td>
                                                    <td className="p-2 text-sm text-gray-500">
                                                        {new Date(commission.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-2">
                                                        {commission.status === 'pending' && (
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => makeAvailable(commission.id)}
                                                                disabled={processing}
                                                            >
                                                                Make Available
                                                            </Button>
                                                        )}
                                                        {commission.status === 'available' && (
                                                            <span className="text-sm text-green-600">Available for withdrawal</span>
                                                        )}
                                                        {commission.status === 'withdrawn' && (
                                                            <span className="text-sm text-gray-500">Withdrawn</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {commissions.data.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No order commissions found</p>
                                    </div>
                                )}
                                
                                {/* Pagination for Order Commissions */}
                                {commissions.last_page > 1 && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                        <div className="flex justify-between flex-1 sm:hidden">
                                            {commissions.current_page > 1 && (
                                                <a href={`?page=${commissions.current_page - 1}`} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Previous
                                                </a>
                                            )}
                                            {commissions.current_page < commissions.last_page && (
                                                <a href={`?page=${commissions.current_page + 1}`} className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Next
                                                </a>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{((commissions.current_page - 1) * 50) + 1}</span> to{' '}
                                                    <span className="font-medium">{Math.min(commissions.current_page * 50, commissions.total)}</span> of{' '}
                                                    <span className="font-medium">{commissions.total}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    {commissions.current_page > 1 && (
                                                        <a href={`?page=${commissions.current_page - 1}`} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                            Previous
                                                        </a>
                                                    )}
                                                    {Array.from({ length: Math.min(5, commissions.last_page) }, (_, i) => {
                                                        const page = i + 1;
                                                        return (
                                                            <a key={page} href={`?page=${page}`} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                page === commissions.current_page
                                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}>
                                                                {page}
                                                            </a>
                                                        );
                                                    })}
                                                    {commissions.current_page < commissions.last_page && (
                                                        <a href={`?page=${commissions.current_page + 1}`} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                            Next
                                                        </a>
                                                    )}
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                {activeTab === 'referrals' && (
                    <div className="space-y-4">
                        {/* Referral Commission Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold">{props.totalReferralCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.totalReferralCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Available</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-green-600">{props.availableReferralCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.availableReferralCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-yellow-600">{props.pendingReferralCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.pendingReferralCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-gray-600">{props.withdrawnReferralCount}</div>
                                    <p className="text-xs text-muted-foreground">GHS {Number(props.withdrawnReferralCommissions || 0).toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Referral Commissions Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Referral Commissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Referrer</th>
                                                <th className="text-left p-2">Type</th>
                                                <th className="text-left p-2">Commission</th>
                                                <th className="text-left p-2">Status</th>
                                                <th className="text-left p-2">Created</th>
                                                <th className="text-left p-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {referralCommissions.data.map((referralCommission) => (
                                                <tr key={referralCommission.id} className="border-b">
                                                    <td className="p-2">
                                                        <div>
                                                            <div className="font-medium">{referralCommission.referrer.name}</div>
                                                            <div className="text-sm text-gray-500">{referralCommission.referrer.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <Badge variant="outline">{referralCommission.type}</Badge>
                                                    </td>
                                                    <td className="p-2 font-semibold">GHS {referralCommission.amount}</td>
                                                    <td className="p-2">{getStatusBadge(referralCommission.status)}</td>
                                                    <td className="p-2 text-sm text-gray-500">
                                                        {new Date(referralCommission.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-2">
                                                        {referralCommission.status === 'pending' && (
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => makeReferralAvailable(referralCommission.id)}
                                                                disabled={processing}
                                                            >
                                                                Make Available
                                                            </Button>
                                                        )}
                                                        {referralCommission.status === 'available' && (
                                                            <span className="text-sm text-green-600">Available for withdrawal</span>
                                                        )}
                                                        {referralCommission.status === 'withdrawn' && (
                                                            <span className="text-sm text-gray-500">Withdrawn</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {referralCommissions.data.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No referral commissions found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}