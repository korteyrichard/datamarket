import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { AdminLayout } from '@/layouts/admin-layout';
import { PageProps, Withdrawal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminWithdrawalsProps extends PageProps {
    withdrawals: {
        data: (Withdrawal & { agent: { name: string; email: string } })[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function AdminWithdrawals({ auth, withdrawals }: AdminWithdrawalsProps) {
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | 'paid' | null>(null);

    const { data, setData, post, processing } = useForm({
        notes: ''
    });

    const handleAction = (withdrawal: Withdrawal, actionType: 'approve' | 'reject' | 'paid') => {
        setSelectedWithdrawal(withdrawal);
        setAction(actionType);
    };

    const submitAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWithdrawal || !action) return;

        post(`/admin/withdrawals/${selectedWithdrawal.id}/${action}`, {
            onSuccess: () => {
                setSelectedWithdrawal(null);
                setAction(null);
                setData('notes', '');
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            paid: 'bg-emerald-100 text-emerald-800',
            rejected: 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={colors[status as keyof typeof colors]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <AdminLayout user={auth.user} header="Withdrawal Management">
            <Head title="Admin - Withdrawals" />

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{withdrawals.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {withdrawals.data.filter(w => w.status === 'pending').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                GHS {withdrawals.data.reduce((sum, w) => sum + Number(w.amount), 0).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Withdrawals Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Agent</th>
                                        <th className="text-left p-2">Amount</th>
                                        <th className="text-left p-2">Payment Details</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Requested</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.data.map((withdrawal) => (
                                        <tr key={withdrawal.id} className="border-b">
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{withdrawal.agent.name}</div>
                                                    <div className="text-sm text-gray-500">{withdrawal.agent.email}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <div>
                                                    <span className="font-semibold">GHS {withdrawal.amount}</span>
                                                    <div className="text-xs text-gray-500">
                                                        Final: GHS {(Number(withdrawal.amount) * 0.98).toFixed(2)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <div className="text-sm">
                                                    <div className="font-medium">{withdrawal.network?.toUpperCase()}</div>
                                                    <div className="text-gray-600">{withdrawal.mobile_money_number}</div>
                                                    <div className="text-gray-500 text-xs">{withdrawal.mobile_money_account_name}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">{getStatusBadge(withdrawal.status)}</td>
                                            <td className="p-2 text-sm text-gray-500">
                                                {new Date(withdrawal.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-2">
                                                {withdrawal.status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAction(withdrawal, 'approve')}
                                                        >
                                                            Process
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleAction(withdrawal, 'reject')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {withdrawal.status === 'processing' && (
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={() => handleAction(withdrawal, 'approve')}
                                                        >
                                                            Mark as Paid
                                                        </Button>
                                                    </div>
                                                )}
                                                {withdrawal.status === 'approved' && (
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={() => handleAction(withdrawal, 'paid')}
                                                        >
                                                            Mark as Paid
                                                        </Button>
                                                    </div>
                                                )}
                                                {withdrawal.notes && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Note: {withdrawal.notes}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {withdrawals.data.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No withdrawal requests found</p>
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {withdrawals.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between flex-1 sm:hidden">
                                    {withdrawals.current_page > 1 && (
                                        <a href={`?page=${withdrawals.current_page - 1}`} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            Previous
                                        </a>
                                    )}
                                    {withdrawals.current_page < withdrawals.last_page && (
                                        <a href={`?page=${withdrawals.current_page + 1}`} className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            Next
                                        </a>
                                    )}
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{((withdrawals.current_page - 1) * 50) + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(withdrawals.current_page * 50, withdrawals.total)}</span> of{' '}
                                            <span className="font-medium">{withdrawals.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            {withdrawals.current_page > 1 && (
                                                <a href={`?page=${withdrawals.current_page - 1}`} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                    Previous
                                                </a>
                                            )}
                                            {Array.from({ length: Math.min(5, withdrawals.last_page) }, (_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <a key={page} href={`?page=${page}`} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === withdrawals.current_page
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}>
                                                        {page}
                                                    </a>
                                                );
                                            })}
                                            {withdrawals.current_page < withdrawals.last_page && (
                                                <a href={`?page=${withdrawals.current_page + 1}`} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
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

            {/* Action Modal */}
            {selectedWithdrawal && action && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {action === 'approve' ? (selectedWithdrawal?.status === 'pending' ? 'Process' : 'Approve') : action === 'reject' ? 'Reject' : 'Mark as Paid'} Withdrawal
                        </h3>
                        
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <p><strong>Agent:</strong> {selectedWithdrawal.agent?.name}</p>
                            <p><strong>Requested Amount:</strong> GHS {selectedWithdrawal.amount}</p>
                            <p><strong>Withdrawal Fee (2%):</strong> GHS {(Number(selectedWithdrawal.amount) * 0.02).toFixed(2)}</p>
                            <p><strong>Final Amount to Pay:</strong> <span className="text-green-600 font-bold">GHS {(Number(selectedWithdrawal.amount) * 0.98).toFixed(2)}</span></p>
                            <p><strong>Network:</strong> {selectedWithdrawal.network?.toUpperCase()}</p>
                            <p><strong>Mobile Number:</strong> {selectedWithdrawal.mobile_money_number}</p>
                            <p><strong>Account Name:</strong> {selectedWithdrawal.mobile_money_account_name}</p>
                        </div>

                        <form onSubmit={submitAction}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Notes {action === 'reject' ? '(Required)' : '(Optional)'}
                                </label>
                                <textarea
                                    className="w-full border rounded-md px-3 py-2 h-24"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder={`Add a note about this ${action}...`}
                                    required={action === 'reject'}
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedWithdrawal(null);
                                        setAction(null);
                                        setData('notes', '');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    variant={action === 'approve' ? 'default' : action === 'reject' ? 'destructive' : 'default'}
                                    className={action === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                >
                                    {processing ? 'Processing...' : `${action === 'approve' ? (selectedWithdrawal?.status === 'pending' ? 'Process' : 'Approve') : action === 'reject' ? 'Reject' : 'Mark as Paid'} Withdrawal`}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}