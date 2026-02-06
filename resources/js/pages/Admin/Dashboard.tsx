import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/admin-layout';
import { PageProps, User } from '@/types';

interface Product {
  id: number;
  name: string;
  network: string;
  amount: number;
}

interface Order {
  id: number;
  user: User;
  total_amount: number;
  status: string;
}

interface Transaction {
  id: number;
  user: User;
  amount: number;
  type: string;
}

interface AdminDashboardProps extends PageProps {
  userCount: number;
  productCount: number;
  orderCount: number;
  transactionCount: number;
  todayUserCount: number;
  todayOrderCount: number;
  todayTransactionCount: number;
  todayRevenue: number;
  totalRevenue: number;
  apiEnabled: boolean;
}

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userCount,
  productCount,
  orderCount,
  transactionCount,
  todayUserCount,
  todayOrderCount,
  todayTransactionCount,
  todayRevenue,
  totalRevenue,
  apiEnabled,
}) => {
  const { auth } = usePage<AdminDashboardProps>().props;
  const [isApiEnabled, setIsApiEnabled] = useState(apiEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const handleApiToggle = () => {
    setIsToggling(true);
    router.post(route('admin.api.toggle'), {
      enabled: !isApiEnabled,
    }, {
      onSuccess: () => {
        setIsApiEnabled(!isApiEnabled);
        setIsToggling(false);
      },
      onError: () => {
        setIsToggling(false);
      },
    });
  };

  return (
    <AdminLayout
      user={auth?.user}
      header={<h2 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>}
    >
      <Head title="Admin Dashboard" />

      <div className="p-6 space-y-10">
        {/* Summary Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Overall Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={userCount} />
            <StatCard title="Total Products" value={productCount} />
            <StatCard title="Total Orders" value={orderCount} />
            <StatCard title="Total Transactions" value={transactionCount} />
          </div>
        </section>

        {/* Revenue Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard title="Today's Revenue" value={`GHS ${Number(todayRevenue || 0).toFixed(2)}`} />
            <StatCard title="Total Revenue" value={`GHS ${Number(totalRevenue || 0).toFixed(2)}`} />
          </div>
        </section>

        {/* Today Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Today's Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="New Users Today" value={todayUserCount} />
            <StatCard title="Orders Today" value={todayOrderCount} />
            <StatCard title="Transactions Today" value={todayTransactionCount} />
          </div>
        </section>

        {/* API Settings Section */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">API Settings</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Order Pusher API</h4>
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  {isApiEnabled ? 'Orders are being sent to the external API' : 'Orders are not being sent to the external API'}
                </p>
              </div>
              <button
                onClick={handleApiToggle}
                disabled={isToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isApiEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isApiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isApiEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {isApiEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
