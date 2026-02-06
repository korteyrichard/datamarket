import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface AgentShop {
    id: number;
    name: string;
    username: string;
    color: string;
    whatsapp_contact?: string;
    is_active: boolean;
}

interface EditShopProps extends PageProps {
    shop: AgentShop;
}

const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' }
];

export default function EditShop({ auth, shop }: EditShopProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: shop.name,
        color: shop.color,
        whatsapp_contact: shop.whatsapp_contact || '',
        is_active: shop.is_active
    });

    const [customColor, setCustomColor] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('dealer.shop.update'));
    };

    const handleColorSelect = (color: string) => {
        setData('color', color);
        setCustomColor('');
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        setData('color', color);
    };

    return (
        <DashboardLayout user={auth.user} header="Edit Shop">
            <Head title="Edit Shop" />

            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Shop Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Shop Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label>Shop Username</Label>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    @{shop.username}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Username cannot be changed after creation
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="whatsapp_contact">WhatsApp Contact (Optional)</Label>
                                <Input
                                    id="whatsapp_contact"
                                    value={data.whatsapp_contact}
                                    onChange={(e) => setData('whatsapp_contact', e.target.value)}
                                    placeholder="e.g., +233501234567 or 0501234567"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Customers will see a "Contact Dealer" button on your shop page
                                </p>
                                {errors.whatsapp_contact && (
                                    <p className="text-sm text-red-600 mt-1">{errors.whatsapp_contact}</p>
                                )}
                            </div>

                            <div>
                                <Label>Shop Color Theme *</Label>
                                <div className="mt-2">
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => handleColorSelect(color.value)}
                                                className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all ${
                                                    data.color === color.value
                                                        ? 'border-gray-400 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div
                                                    className="w-6 h-6 rounded-full border"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                                <span className="text-sm">{color.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="custom-color" className="text-sm">Custom Color:</Label>
                                        <input
                                            id="custom-color"
                                            type="color"
                                            value={customColor || data.color}
                                            onChange={handleCustomColorChange}
                                            className="w-10 h-8 rounded border cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-600">{data.color}</span>
                                    </div>
                                </div>
                                {errors.color && (
                                    <p className="text-sm text-red-600 mt-1">{errors.color}</p>
                                )}
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

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Preview</h4>
                                <div 
                                    className="p-4 rounded-lg text-white"
                                    style={{ backgroundColor: data.color }}
                                >
                                    <h3 className="font-bold text-lg">{data.name}</h3>
                                    <p className="text-sm opacity-90">@{shop.username}</p>
                                    {!data.is_active && (
                                        <p className="text-xs opacity-75 mt-1">(Shop is inactive)</p>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}