import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { PageProps, Withdrawal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

interface AgentWithdrawalsProps extends PageProps {
    withdrawals: {
        data: Withdrawal[];
        current_page: number;
        last_page: number;
        total: number;
    };
    walletBalance: number;
    earningsBreakdown: {
        total_commissions: number;
        available_commissions: number;
        pending_commissions: number;
        total_referral_earnings: number;
        available_referral_earnings: number;
        pending_referral_earnings: number;
        total_available: number;
        total_earnings: number;
        pending_withdrawals: number;
    };
}

export default function AgentWithdrawals({ auth, withdrawals, walletBalance, earningsBreakdown }: AgentWithdrawalsProps) {
    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        network: '',
        mobile_money_account_name: '',
        mobile_money_number: ''
    });

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg',
            processing: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg',
            approved: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg',
            paid: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg',
            rejected: 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg'
        };

        return (
            <Badge className={colors[status as keyof typeof colors]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const handleWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.amount) {
            console.error('No amount provided');
            return;
        }
        
        const withdrawalAmount = parseFloat(data.amount);
        console.log('Submitting withdrawal request:', {
            amount: withdrawalAmount,
            available_balance: earningsBreakdown?.total_available
        });
        
        post('/dealer/withdrawals', {
            onSuccess: () => {
                console.log('Withdrawal request successful');
                setData({
                    amount: '',
                    network: '',
                    mobile_money_account_name: '',
                    mobile_money_number: ''
                });
            },
            onError: (errors) => {
                console.error('Withdrawal request failed:', errors);
            },
            onFinish: () => {
                console.log('Withdrawal request finished');
            }
        });
    };

    const totalWithdrawn = withdrawals.data
        .filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + Number(w.amount), 0);
    
    const pendingAmount = Number(earningsBreakdown?.pending_withdrawals) || 0;

    return (
        <DashboardLayout 
            user={auth.user} 
            header={
                <h2 className="font-semibold text-xl text-white leading-tight">
                    My Withdrawals
                </h2>
            }
        >
            <Head title="Agent Withdrawals" />

            <div className="py-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-white/90">Total Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">GHS {(Number(earningsBreakdown?.total_available) || 0).toFixed(2)}</div>
                            <p className="text-white/80 text-xs mt-1">Ready to withdraw</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-white/90">Purchase Commissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">GHS {(Number(earningsBreakdown?.available_commissions) || 0).toFixed(2)}</div>
                            <p className="text-white/80 text-xs mt-1">From product sales</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-white/90">Referral Earnings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">GHS {(Number(earningsBreakdown?.available_referral_earnings) || 0).toFixed(2)}</div>
                            <p className="text-white/80 text-xs mt-1">From referrals</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-white/90">Total Withdrawn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">GHS {totalWithdrawn.toFixed(2)}</div>
                            <p className="text-white/80 text-xs mt-1">Successfully withdrawn</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-white/90">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">GHS {pendingAmount.toFixed(2)}</div>
                            <p className="text-white/80 text-xs mt-1">Being processed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Request Withdrawal */}
                <Card className="shadow-xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center gap-2">
                            Request Withdrawal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleWithdrawal} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Withdrawal Amount (GHS)
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="50"
                                            max={earningsBreakdown?.total_available || 0}
                                            placeholder="Enter amount to withdraw"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className="text-xl py-4 px-4 border-2 focus:border-green-500 transition-colors"
                                        />
                                        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Mobile Network
                                        </label>
                                        <select
                                            value={data.network}
                                            onChange={(e) => setData('network', e.target.value)}
                                            className="w-full py-4 px-4 border-2 rounded-md focus:border-green-500 transition-colors text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Select Network</option>
                                            <option value="mtn">MTN</option>
                                            <option value="telecel">Telecel</option>
                                        </select>
                                        {errors.network && <p className="text-red-500 text-sm mt-1">{errors.network}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Account Name
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Enter account holder name"
                                            value={data.mobile_money_account_name}
                                            onChange={(e) => setData('mobile_money_account_name', e.target.value)}
                                            className="text-lg py-4 px-4 border-2 focus:border-green-500 transition-colors"
                                        />
                                        {errors.mobile_money_account_name && <p className="text-red-500 text-sm mt-1">{errors.mobile_money_account_name}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Mobile Money Number
                                        </label>
                                        <Input
                                            type="tel"
                                            placeholder="Enter mobile money number"
                                            value={data.mobile_money_number}
                                            onChange={(e) => setData('mobile_money_number', e.target.value)}
                                            className="text-lg py-4 px-4 border-2 focus:border-green-500 transition-colors"
                                        />
                                        {errors.mobile_money_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_money_number}</p>}
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Minimum Amount:</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">GHS 50.00</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Available Balance:</span>
                                            <span className="text-sm font-bold text-green-600 dark:text-green-400">GHS {(Number(earningsBreakdown?.total_available) || 0).toFixed(2)}</span>
                                        </div>
                                        {data.amount && Number(data.amount) > 0 && (
                                            <>
                                                <hr className="my-2" />
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Withdrawal Fee (2%):</span>
                                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">GHS {(Number(data.amount) * 0.02).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Final Amount:</span>
                                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">GHS {(Number(data.amount) * 0.98).toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Withdrawal Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">Processing Time:</span>
                                                <span className="font-medium dark:text-gray-200">Next Working Day</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">Withdrawal Fee:</span>
                                                <span className="font-medium text-red-600 dark:text-red-400">2%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">Payment Method:</span>
                                                <span className="font-medium dark:text-gray-200">Mobile Money</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="submit" 
                                        disabled={processing || !data.amount || !data.network || !data.mobile_money_account_name || !data.mobile_money_number || Number(data.amount) < 50 || Number(data.amount) > (earningsBreakdown?.total_available || 0)}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Processing...
                                            </div>
                                        ) : (
                                            'Request Withdrawal'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Withdrawal History */}
                <Card className="shadow-xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center gap-2">
                            Withdrawal History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Payment Details</th>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Requested</th>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Processed</th>
                                        <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.data.map((withdrawal, index) => (
                                        <tr key={withdrawal.id} className={`border-b hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'}`}>
                                            <td className="p-4">
                                                <div>
                                                    <span className="font-bold text-green-600 text-lg">GHS {withdrawal.amount}</span>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Final: GHS {(Number(withdrawal.amount) * 0.98).toFixed(2)} (after 2% fee)
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-800 dark:text-gray-200">{withdrawal.network?.toUpperCase()}</div>
                                                    <div className="text-gray-600 dark:text-gray-300">{withdrawal.mobile_money_number}</div>
                                                    <div className="text-gray-500 dark:text-gray-400 text-xs">{withdrawal.mobile_money_account_name}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">{getStatusBadge(withdrawal.status)}</td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {withdrawal.processed_at 
                                                    ? new Date(withdrawal.processed_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : <span className="text-gray-400 dark:text-gray-500 italic">Pending</span>
                                                }
                                            </td>
                                            <td className="p-4 text-sm">
                                                {withdrawal.notes ? (
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                        {withdrawal.notes}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 italic">No notes</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {withdrawals.data.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No withdrawal requests found</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Make your first withdrawal request above!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}