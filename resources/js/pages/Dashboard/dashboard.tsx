import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import React, { useState } from 'react';
import TelecelCard from '../../components/TelecelCard';
import ATCard from '../../components/ATCard';
import MTNCard from '../../components/MTNCard';
import AlertBanner from '../../components/AlertBanner';
import { Icon } from '@/components/ui/icon';
import { Link } from '@inertiajs/react';
import PwaInstallBanner from '../../components/PwaInstallBanner';
import axios from '@/lib/axios';


interface Product {
  id: number;
  name: string;
  quantity: string;
  currency: string;
  expiry: string;
  network: string;
  status: 'IN STOCK' | 'OUT OF STOCK';
  productId: number;
  price: number; // Add price as optional
}

interface Order {
  id: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | string;
  // ...other order fields as needed
}

interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: string;
  beneficiary_number: string;
  product: {
    name: string;
    price: number;
    network: string;
    expiry: string;
  };
}

interface DashboardProps extends PageProps {
  products: Product[];
  cartCount: number;
  cartItems: CartItem[];
  walletBalance: number;
  orders: Order[];
  alerts: Alert[];
}

export default function Dashboard({ auth }: DashboardProps) {
  const { products, cartCount, cartItems, walletBalance: initialWalletBalance, orders, alerts } = usePage<DashboardProps>().props;

  const [walletBalance, setWalletBalance] = useState(initialWalletBalance ?? 0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('MTN');

  const networkTabs = ['MTN', 'TELECEL', 'AT Data (Instant)', 'AT (Big Packages)'];
  
  // Fix filteredPackages typing and prop usage
  const filteredPackages = products.filter(pkg => pkg.network === activeTab);

  // Order stats
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(order => order.status?.toLowerCase() === 'pending').length || 0;
  const processingOrders = orders?.filter(order => order.status?.toLowerCase() === 'processing').length || 0;
  const completedOrders = orders?.filter(order => order.status?.toLowerCase() === 'completed').length || 0;

  return (
    <DashboardLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Dashboard</h2>}
    >
      <Head title="Dashboard" />

      {/* Wallet Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs relative border border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              onClick={() => setShowAddModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Add to Wallet</h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsAdding(true);
                setAddError(null);
                try {
                  const response = await axios.post('/dashboard/wallet/add', { amount: addAmount });
                  const data = response.data;
                  if (data.success && data.payment_url) {
                    // Redirect to Paystack payment page
                    window.location.href = data.payment_url;
                  } else {
                    setAddError(data.message || 'Failed to initialize payment.');
                  }
                } catch (err: any) {
                  const errorMessage = err.response?.data?.message || 'Error initializing payment.';
                  setAddError(errorMessage);
                } finally {
                  setIsAdding(false);
                }
              }}
            >
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="rounded px-2 py-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                required
                disabled={isAdding}
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                disabled={isAdding || !addAmount}
              >
                {isAdding ? 'Processing...' : 'Top Up'}
              </button>
              {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Alert Popup Overlay */}
      <AlertBanner alerts={alerts || []} />
      
      <div className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Action Buttons Section */}
          {auth.user.role === 'customer' && (
          <div className='w-full mb-6 sm:mb-10'>
                   <Link
                      href={route('become-a-dealer')}
                      className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-center text-gray-700 font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Become a Dealer
                    </Link>
              </div>)
           }
           
           {/* Agent/Dealer Action Buttons */}
           {auth.user.role === 'agent' && (
           <div className='w-full mb-6 sm:mb-10'>
                   <Link
                      href={route('become-a-dealer')}
                      className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-center text-white font-medium rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Become a Dealer
                    </Link>
              </div>)
           }
           
           {/* Dealer Dashboard Link */}
           {auth.user.role === 'dealer' && (
           <div className='w-full mb-6 sm:mb-10'>
                   <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                     <Link
                        href={route('dealer.dashboard')}
                        className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-center text-white font-medium rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-green-600 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Dealer Dashboard
                      </Link>
                      {auth.user.agent_shop && (
                        <Link
                          href={`/shop/${auth.user.agent_shop.username}`}
                          className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-center text-gray-700 font-medium rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                        >
                          View My Shop
                        </Link>
                      )}
                   </div>
              </div>)
           }

          {/* Stats Cards Section */}
          <div className="mb-8 sm:mb-10">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Wallet Balance Card - Featured */}
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Wallet Balance</p>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">GHS {walletBalance}</p>
                  <button
                    className="w-12 h-12 bg-white/40 hover:bg-white/50 transition-all duration-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-110"
                    onClick={() => setShowAddModal(true)}
                    aria-label="Add to wallet"
                    title="Add funds to wallet"
                  >
                    <span className="text-2xl font-bold">+</span>
                  </button>
                </div>
              </div>
              

              {/* Total Orders Card */}
              <div className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">Total Orders</h3>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>

              {/* Pending Orders Card */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">Pending</h3>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>

              {/* Processing Orders Card */}
              <div className="bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">Processing</h3>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold">{processingOrders}</p>
              </div>

              {/* Completed Orders Card */}
              <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">Completed</h3>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold">{completedOrders}</p>
              </div>
            </div>
          </div>

          {/* Data Packages Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Packages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available data packages by network</p>
            </div>

            {/* Network Filter Tabs */}
            <div className="border-b border-gray-100 dark:border-gray-700">
              <div className="px-6">
                {/* Mobile: Select Dropdown */}
                <div className="sm:hidden mb-2">
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:ring focus:ring-blue-500 text-sm"
                    value={activeTab}
                    onChange={e => setActiveTab(e.target.value)}
                  >
                    {networkTabs.map(network => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                </div>
                {/* Desktop: Tab Buttons */}
                <nav className="hidden sm:flex space-x-0 overflow-x-auto scrollbar-hide" aria-label="Network tabs">
                  {networkTabs.map((network) => (
                    <button
                      key={network}
                      onClick={() => setActiveTab(network)}
                      className={`
                        relative min-w-0 flex-1 sm:flex-none sm:min-w-max whitespace-nowrap py-4 px-4 sm:px-6 text-sm font-medium text-center border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
                        ${activeTab === network
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <span className="relative">
                        {network}
                        {activeTab === network && (
                          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500 rounded-full"></span>
                        )}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Data Packages Grid */}
            <div className="p-6">
              {filteredPackages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredPackages.map((data: Product, index) => (
                    <div key={`${data.network}-${index}`} className="transform transition-all duration-300 hover:-translate-y-1">
                      {data.network === 'MTN' ? (
                        <MTNCard
                          name={data.name}
                          quantity={data.quantity}
                          currency={data.currency}
                          expiry={data.expiry}
                          network={data.network}
                          productId={data.id}
                          price={data.price}
                          cartItems={cartItems}
                        />
                      ) : data.network === 'TELECEL' ? (
                        <TelecelCard
                          name={data.name}
                          quantity={data.quantity}
                          currency={data.currency}
                          expiry={data.expiry}
                          network={data.network}
                          productId={data.id}
                          price={data.price}
                          cartItems={cartItems}
                        />
                      ) : data.network === 'AT Data (Instant)' ? (
                        <ATCard
                          name={data.name}
                          quantity={data.quantity}
                          currency={data.currency}
                          expiry={data.expiry}
                          network={data.network}
                          productId={data.id}
                          price={data.price}
                          cartItems={cartItems}
                        />
                      ) : data.network === 'AT (Big Packages)' ? (
                        <ATCard
                          name={data.name}
                          quantity={data.quantity}
                          currency={data.currency}
                          expiry={data.expiry}
                          network={data.network}
                          productId={data.id}
                          price={data.price}
                          cartItems={cartItems}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No packages available</h3>
                  <p className="text-gray-500 dark:text-gray-400">No data packages found for {activeTab}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Floating Cart Button */}
          <Link
            href={route('cart.index')}
            className="fixed z-50 bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-indigo-300"
            aria-label="View Cart"
          >
            <Icon name="ShoppingCart" className="w-8 h-8" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
                {cartCount}
              </span>
            )}
            <span className="sr-only">Open Cart</span>
          </Link>
        </div>
      </div>
      <PwaInstallBanner />
    </DashboardLayout>
  );
}
