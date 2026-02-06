import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { PageProps, AgentShop } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AgentShopSettingsProps extends PageProps {
    shop: AgentShop;
}

export default function AgentShopSettings({ auth, shop }: AgentShopSettingsProps) {
    const { data, setData, put, processing } = useForm({
        name: shop.name,
        is_active: shop.is_active
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/api/agent/shop/${shop.id}`);
    };

    return (
        <DashboardLayout user={auth.user} header="Shop Settings">
            <Head title="Shop Settings" />

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Shop Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Shop Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Shop URL</Label>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    /shop/{shop.username}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Username cannot be changed after creation
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <Label htmlFor="is_active">Shop is active</Label>
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Share Your Shop</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label>Shop URL</Label>
                                <div className="flex">
                                    <Input
                                        value={`${window.location.origin}/shop/${shop.username}`}
                                        readOnly
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        className="ml-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.username}`);
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Referral Code</Label>
                                <div className="flex">
                                    <Input
                                        value={auth.user.api_key || 'Generate API key first'}
                                        readOnly
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        className="ml-2"
                                        onClick={() => {
                                            if (auth.user.api_key) {
                                                navigator.clipboard.writeText(auth.user.api_key);
                                            }
                                        }}
                                        disabled={!auth.user.api_key}
                                    >
                                        Copy
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Share this code with new agents to earn referral commissions
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}