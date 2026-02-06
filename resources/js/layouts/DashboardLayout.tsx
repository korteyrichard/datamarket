import React, { PropsWithChildren, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { icons } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps extends PropsWithChildren {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        agent_shop?: {
            username: string;
        };
    };
    header?: React.ReactNode;
}

type IconName = keyof typeof icons;

interface NavigationItem {
    name: string;
    href: string;
    icon: IconName;
    current: boolean;
}

export default function DashboardLayout({ user, header, children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const baseNavigation: NavigationItem[] = [
        { name: 'Dashboard', href: route('dashboard'), icon: 'LayoutDashboard', current: route().current('dashboard') },
        { name: 'Wallet', href: route('dashboard.wallet'), icon: 'Wallet', current: route().current('dashboard.wallet') },
        { name: 'Whatsapp Group', href: route('dashboard.joinUs'), icon: 'Contact', current: route().current('dashboard.joinUs') },
        { name: 'Orders', href: route('dashboard.orders'), icon: 'Package', current: route().current('dashboard.orders') },
        { name: 'Transactions', href: route('dashboard.transactions'), icon: 'Receipt', current: route().current('dashboard.transactions') },
        { name: 'Terms And Conditions', href: route('dashboard.terms'), icon: 'FileText', current: route().current('dashboard.terms') },
    ];

    const dealerNavigation: NavigationItem[] = [
        { name: 'Dealer Dashboard', href: '/dealer/dashboard', icon: 'Store', current: window.location.pathname === '/dealer/dashboard' },
        { name: 'Commissions', href: '/dealer/commissions', icon: 'DollarSign', current: window.location.pathname === '/dealer/commissions' },
        { name: 'Withdrawals', href: '/dealer/withdrawals', icon: 'CreditCard', current: window.location.pathname === '/dealer/withdrawals' },
        { name: 'Referrals', href: '/dealer/referrals', icon: 'Users', current: window.location.pathname === '/dealer/referrals' },
        { name: 'My Shop', href: `/shop/${user.agent_shop?.username || ''}`, icon: 'ShoppingBag', current: false },
    ];

    const apiDocsItem: NavigationItem = { name: 'API Docs', href: route('dashboard.api-docs'), icon: 'Code', current: route().current('dashboard.api-docs') };
    const settingsItem: NavigationItem = { name: 'Settings', href: route('profile.edit'), icon: 'Settings', current: route().current('profile.edit') || route().current('password.edit') || route().current('appearance') };

    const navigation: NavigationItem[] = [
        ...baseNavigation,
        ...(user.role === 'dealer' ? dealerNavigation : []),
        ...(user.role === 'dealer' || user.role === 'admin' ? [apiDocsItem] : []),
        settingsItem,
    ];

   

   

    const renderNavigationItems = (items: NavigationItem[], closeSidebar = false) => {
        return items.map((item) => (
            <Link
                key={item.name}
                href={item.href}
                method={item.name === 'Log Out' ? 'post' : 'get'}
                as={item.name === 'Log Out' ? 'button' : 'a'}
                className={`
                    ${item.current
                        ? 'bg-white/20 text-white font-semibold shadow-lg'
                        : 'text-yellow-100 hover:bg-white/10 hover:text-white'
                    }
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full
                `}
                onClick={closeSidebar ? () => setSidebarOpen(false) : undefined}
            >
                <Icon name={item.icon} className="mr-3 flex-shrink-0 h-6 w-6" />
                {item.name}
            </Link>
        ));
    };

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="flex flex-col flex-grow bg-gradient-to-b from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 pt-5 pb-4 overflow-y-auto h-full">
            <div className="flex items-center flex-shrink-0 px-4">
                <Link href="/">
                    <div className="text-white text-2xl font-bold drop-shadow-lg">
                        {isMobile ? 'Data Market' : 'Data Market'}
                    </div>
                </Link>
            </div>
            <nav className="mt-5 flex-1 flex flex-col min-h-screen">
                <div className="px-2 space-y-1">
                    {renderNavigationItems(navigation, isMobile)}
                </div>
                
                <a href='https://t.me/Richie_bankx' className="w-[200px] ml-3 text-left mt-10 px-2 py-2 text-sm font-bold rounded-md text-white bg-blue-500 hover:bg-blue-600 shadow-lg">
                     Contact Support
                </a>


               
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar for desktop */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
                <div className="shadow-md">
                    <SidebarContent />
                </div>
            </div>

            {/* Main content area */}
            <div className="lg:pl-64 flex flex-col flex-1">
                {/* Navbar */}
                <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 shadow-lg">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <div className="flex items-center px-4 lg:hidden">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-yellow-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/20"
                                >
                                    <span className="sr-only">Open sidebar</span>
                                    <Icon name="Menu" className="h-6 w-6" />
                                </Button>
                            </div>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <SidebarContent isMobile={true} />
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1 flex justify-between px-4">
                        <div className="flex-1 flex items-center">
                            {header && (
                                <h2 className="font-semibold text-xl text-white drop-shadow-lg leading-tight">
                                    {header}
                                </h2>
                            )}
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/10">
                                        <Icon name="User" className="h-6 w-6 text-white" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs leading-none text-gray-600 dark:text-gray-300">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} className="w-full text-left">
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('logout')} method="post" as="button" className="w-full text-left">
                                            Log out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <main className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}