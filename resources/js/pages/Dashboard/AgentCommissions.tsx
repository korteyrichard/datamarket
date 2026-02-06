import DashboardLayout from '../../layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React from 'react';

interface Commission {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    available_at?: string;
    order: {
        id: number;
        total: number;
    };
}

interface AgentCommissionsProps extends PageProps {
    commissions: {
        data: Commission[];
        current_page: number;
        last_page: number;
        total: number;
    };
    totals: {
        total_earnings: number;
        available_earnings: number;
        todays_earnings: number;
        total_orders: number;
    };
}

export default function AgentCommissions({ auth, commissions, totals }: AgentCommissionsProps) {
    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg',
            available: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg',
            withdrawn: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg'
        };

        return (
            <Badge className={colors[status as keyof typeof colors]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Use totals from backend instead of calculating from paginated data
    const totalEarnings = Number(totals.total_earnings);
    const availableEarnings = Number(totals.available_earnings);
    const todaysEarnings = Number(totals.todays_earnings);

    return (
        <DashboardLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-white leading-tight">
                    Dealer Commissions
                </h2>
            }
        >
            <Head title="Dealer Commissions" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Total Commissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GHS {totalEarnings.toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">From product sales</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Today's Commissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GHS {todaysEarnings.toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">Earned today</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Total Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totals.total_orders}</div>
                                <p className="text-white/80 text-xs mt-1">Commission orders</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Commissions Table */}
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                        <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                                Purchase Commission History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-gray-700">Order ID</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Order Total</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Commission</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissions.data.map((commission, index) => (
                                            <tr key={commission.id} className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                <td className="p-4">
                                                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        #{commission.order.id}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-semibold text-gray-700">GHS {commission.order.total}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-green-600 text-lg">GHS {commission.amount}</span>
                                                </td>
                                                <td className="p-4">{getStatusBadge(commission.status)}</td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(commission.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {commissions.data.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No commissions found</p>
                                    <p className="text-gray-400 text-sm mt-2">Start selling to earn commissions!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}