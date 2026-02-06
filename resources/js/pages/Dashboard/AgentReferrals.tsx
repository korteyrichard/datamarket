import DashboardLayout from '../../layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import React from 'react';

interface ReferralStats {
    total_referrals: number;
    total_earnings: number;
    available_earnings: number;
    pending_earnings: number;
    referrals: Array<{
        id: number;
        referred: {
            name: string;
            email: string;
            role: string;
        };
        converted_at: string | null;
        created_at: string;
    }>;
    commissions: Array<{
        id: number;
        amount: number;
        status: string;
        type: string;
        created_at: string;
    }>;
}

interface AgentReferralsProps extends PageProps {
    referralStats: ReferralStats;
    referralLink: string;
}

export default function AgentReferrals({ auth, referralStats, referralLink }: AgentReferralsProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

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

    const getRoleBadge = (role: string) => {
        const colors = {
            user: 'bg-blue-100 text-blue-800',
            dealer: 'bg-purple-100 text-purple-800',
            admin: 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
        );
    };

    return (
        <DashboardLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-white leading-tight">
                    Dealer Referrals
                </h2>
            }
        >
            <Head title="Dealer Referrals" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Total Referrals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{referralStats.total_referrals}</div>
                                <p className="text-white/80 text-xs mt-1">People referred</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Total Earnings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GHS {(Number(referralStats.total_earnings) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">From referrals only</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-white/90">Available</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">GHS {(Number(referralStats.available_earnings) || 0).toFixed(2)}</div>
                                <p className="text-white/80 text-xs mt-1">Referral earnings ready</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Referral Link */}
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                        <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                                Your Referral Link
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Referral Link</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={referralLink}
                                            readOnly
                                            className="flex-1 bg-gray-50 font-mono text-sm"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => copyToClipboard(referralLink)}
                                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 shadow-lg"
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Referral Code</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={auth.user.referral_code || 'Not generated'}
                                            readOnly
                                            className="flex-1 bg-gray-50 font-mono text-lg font-bold text-center"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => copyToClipboard(auth.user.referral_code || '')}
                                            disabled={!auth.user.referral_code}
                                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 shadow-lg disabled:opacity-50"
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Referrals List */}
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                                Your Referrals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-gray-700">User</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referralStats.referrals.map((referral, index) => (
                                            <tr key={referral.id} className={`border-b hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                <td className="p-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{referral.referred.name}</div>
                                                        <div className="text-sm text-gray-500">{referral.referred.email}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {getRoleBadge(referral.referred.role)}
                                                </td>
                                                <td className="p-4">
                                                    {referral.converted_at ? (
                                                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                                                            Converted
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(referral.created_at).toLocaleDateString('en-US', {
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

                            {referralStats.referrals.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No referrals yet</p>
                                    <p className="text-gray-400 text-sm mt-2">Share your referral link to start earning!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Referral Commissions */}
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                                Referral Commission History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                                            <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referralStats.commissions.map((commission, index) => (
                                            <tr key={commission.id} className={`border-b hover:bg-emerald-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                <td className="p-4">
                                                    <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg">
                                                        {commission.type.replace('_', ' ')}
                                                    </Badge>
                                                </td>
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

                            {referralStats.commissions.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No referral commissions yet</p>
                                    <p className="text-gray-400 text-sm mt-2">Earn commissions when your referrals make purchases!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}