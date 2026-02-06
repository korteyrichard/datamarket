import { LucideIcon, icons } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: keyof typeof icons;
    isActive?: boolean;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: Auth;
    users: User[];
    ziggy: Config & { location: string };
};

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone: string | null;
    role: 'customer' | 'agent' | 'dealer' | 'admin';
    wallet_balance: number;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    agent_shop?: AgentShop;
    [key: string]: unknown;
}

export interface AgentShop {
    id: number;
    user_id: number;
    name: string;
    username: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AgentProduct {
    id: number;
    agent_shop_id: number;
    product_id: number;
    agent_price: number;
    is_active: boolean;
    product: Product;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    network: string;
    quantity: string;
    status: string;
    product_type: string;
}

export interface Commission {
    id: number;
    agent_id: number;
    order_id: number;
    amount: number;
    status: 'pending' | 'available' | 'withdrawn';
    available_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Withdrawal {
    id: number;
    agent_id: number;
    amount: number;
    payment_method: 'mobile_money';
    network: 'mtn' | 'telecel';
    mobile_money_account_name: string;
    mobile_money_number: string;
    status: 'pending' | 'processing' | 'approved' | 'paid';
    notes: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface AgentDashboardData {
    total_sales: number;
    pending_commissions: number;
    available_balance: number;
    withdrawn_balance: number;
    referral_earnings: number;
}

export interface Transaction {
    id: number;
    user_id: number;
    order_id: number | null;
    amount: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    type: 'wallet_topup' | 'order_payment' | 'agent_fee' | 'refund';
    description: string;
    reference: string | null;
    created_at: string;
    updated_at: string;
    order?: any;
    user?: User;
}
