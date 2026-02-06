import { Head, useForm, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { PageProps, User, AgentShop } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface AdminAgentsProps extends PageProps {
    agents: {
        data: (User & { 
            agent_shop: AgentShop;
            commissions_sum_amount: number;
            referral_commissions_sum_amount: number;
            total_commissions: number;
            available_commissions: number;
            withdrawn_commissions: number;
        })[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function AdminAgents({ auth, agents }: AdminAgentsProps) {
    const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
    const [action, setAction] = useState<'activate' | 'deactivate' | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const { flash, errors } = usePage().props as any;

    const { post, processing } = useForm();

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            setNotification({type: 'success', message: flash.success});
            setTimeout(() => setNotification(null), 5000);
        }
        if (flash?.error || errors?.error) {
            setNotification({type: 'error', message: flash?.error || errors?.error});
            setTimeout(() => setNotification(null), 5000);
        }
    }, [flash, errors]);

    const handleShopToggle = (agent: User, newStatus: boolean) => {
        console.log('Toggling shop for agent:', agent.id, 'to status:', newStatus);
        
        post(`/admin/agents/${agent.id}/shop/toggle`, 
            { is_active: newStatus },
            {
                onSuccess: () => {
                    setSelectedAgent(null);
                    setAction(null);
                    console.log('Shop toggle successful');
                },
                onError: (errors) => {
                    console.error('Shop toggle failed:', errors);
                    setNotification({type: 'error', message: 'Failed to update shop status'});
                    setTimeout(() => setNotification(null), 5000);
                }
            }
        );
    };

    return (
        <AdminLayout user={auth.user} header="Agent Management">
            <Head title="Admin - Agents" />

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {notification.message}
                </div>
            )}

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agents.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {agents.data.filter(a => a.agent_shop?.is_active).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Inactive Shops</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {agents.data.filter(a => !a.agent_shop?.is_active).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-green-600">Total Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ${agents.data.reduce((sum, agent) => sum + Number(agent.available_commissions || 0), 0).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-blue-600">Total Withdrawn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                ${agents.data.reduce((sum, agent) => sum + Number(agent.withdrawn_commissions || 0), 0).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Agents Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Agents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Agent</th>
                                        <th className="text-left p-2">Shop Name</th>
                                        <th className="text-left p-2">Username</th>
                                        <th className="text-left p-2">Total Commissions</th>
                                        <th className="text-left p-2">Available</th>
                                        <th className="text-left p-2">Withdrawn</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Joined</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.data.map((agent) => (
                                        <tr key={agent.id} className="border-b">
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{agent.name}</div>
                                                    <div className="text-sm text-gray-500">{agent.email}</div>
                                                </div>
                                            </td>
                                            <td className="p-2">{agent.agent_shop?.name || '-'}</td>
                                            <td className="p-2">
                                                {agent.agent_shop?.username ? (
                                                    <a 
                                                        href={`/shop/${agent.agent_shop.username}`}
                                                        className="text-blue-600 hover:underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {agent.agent_shop.username}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td className="p-2 font-semibold">
                                                ${Number(agent.total_commissions || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 font-medium text-green-600">
                                                ${Number(agent.available_commissions || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 font-medium text-blue-600">
                                                ${Number(agent.withdrawn_commissions || 0).toFixed(2)}
                                            </td>
                                            <td className="p-2">
                                                <Badge variant={agent.agent_shop?.is_active ? "default" : "secondary"}>
                                                    {agent.agent_shop?.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-sm text-gray-500">
                                                {new Date(agent.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-2 space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(`/admin/dealers/${agent.id}/commissions`, '_blank')}
                                                >
                                                    View Commissions
                                                </Button>
                                                {agent.agent_shop && (
                                                    <Button
                                                        size="sm"
                                                        variant={agent.agent_shop.is_active ? "destructive" : "default"}
                                                        onClick={() => handleShopToggle(agent, !agent.agent_shop.is_active)}
                                                        disabled={processing}
                                                    >
                                                        {agent.agent_shop.is_active ? 'Deactivate' : 'Activate'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {agents.data.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No agents found</p>
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {agents.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                                <div className="flex justify-between flex-1 sm:hidden">
                                    {agents.current_page > 1 && (
                                        <a href={`?page=${agents.current_page - 1}`} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            Previous
                                        </a>
                                    )}
                                    {agents.current_page < agents.last_page && (
                                        <a href={`?page=${agents.current_page + 1}`} className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                            Next
                                        </a>
                                    )}
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{((agents.current_page - 1) * 50) + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(agents.current_page * 50, agents.total)}</span> of{' '}
                                            <span className="font-medium">{agents.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            {agents.current_page > 1 && (
                                                <a href={`?page=${agents.current_page - 1}`} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                    Previous
                                                </a>
                                            )}
                                            {Array.from({ length: Math.min(5, agents.last_page) }, (_, i) => {
                                                const page = i + 1;
                                                return (
                                                    <a key={page} href={`?page=${page}`} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === agents.current_page
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}>
                                                        {page}
                                                    </a>
                                                );
                                            })}
                                            {agents.current_page < agents.last_page && (
                                                <a href={`?page=${agents.current_page + 1}`} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
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
        </AdminLayout>
    );
}