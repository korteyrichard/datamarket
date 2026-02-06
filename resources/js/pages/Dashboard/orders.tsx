import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, usePage, router } from '@inertiajs/react';

interface Product {
  id: number;
  name: string;
  price: number;
  pivot: {
    quantity: number;
    price: number;
    beneficiary_number?: string;
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  network?: string;
  beneficiary_number?: string;
  customer_email?: string;
  paystack_reference?: string;
  products: Product[];
}

interface OrdersPageProps {
  orders: Order[];
  auth: any;
  searchOrderId: string;
  searchBeneficiaryNumber: string;
  [key: string]: any;
}

export default function OrdersPage() {
  const { orders, auth, searchOrderId, searchBeneficiaryNumber } = usePage<OrdersPageProps>().props;
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [networkFilter, setNetworkFilter] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState(searchOrderId);
  const [beneficiarySearch, setBeneficiarySearch] = useState(searchBeneficiaryNumber);

  // Extract unique networks for filter dropdown
  const networks = Array.from(new Set(orders.map(o => o.network).filter(Boolean)));

  const filteredOrders = networkFilter
    ? orders.filter(order => order.network === networkFilter)
    : orders;

  const handleExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };



  const getNetworkColor = (network?: string) => {
    if (!network) return '';
    if (network.toLowerCase() === 'telecel') return 'bg-gradient-to-r from-red-50 to-red-100';
    if (network.toLowerCase() === 'mtn') return 'bg-gradient-to-r from-yellow-50 to-yellow-100';
    if (network.toLowerCase() === 'at data (instant)' || network.toLowerCase() === 'at (big packages)') return 'bg-gradient-to-r from-blue-50 to-blue-100';
    return 'bg-gradient-to-r from-gray-50 to-gray-100';
  };

  return (
    <DashboardLayout user={auth?.user} header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">My Orders</h2>}>
      <Head title="Orders" />
      <div className="py-8 max-w-6xl mx-auto px-4">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 -m-6 mb-6 p-4 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search & Filter Orders
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by Order ID</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  placeholder="Enter order ID"
                  value={orderIdSearch}
                  onChange={e => {
                    setOrderIdSearch(e.target.value);
                    router.get(route('dashboard.orders'), {
                      order_id: e.target.value || undefined
                    }, { preserveState: true, replace: true });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by Beneficiary Number</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  placeholder="Enter beneficiary number"
                  value={beneficiarySearch}
                  onChange={e => {
                    setBeneficiarySearch(e.target.value);
                    router.get(route('dashboard.orders'), {
                      beneficiary_number: e.target.value || undefined
                    }, { preserveState: true, replace: true });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Network</label>
                <select
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  value={networkFilter}
                  onChange={e => setNetworkFilter(e.target.value)}
                >
                  <option value="">All Networks</option>
                  {networks.map(network => (
                    <option key={network} value={network}>{network}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria or create your first order.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Your Orders ({filteredOrders.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Network</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 cursor-pointer transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750'
                        }`}
                        onClick={() => handleExpand(order.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              order.network?.toLowerCase() === 'telecel' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                              order.network?.toLowerCase() === 'mtn' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              order.network?.toLowerCase().includes('at') ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                              'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}></div>
                            <span className="font-bold text-gray-900 dark:text-gray-100">#{order.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.network?.toLowerCase() === 'telecel' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                            order.network?.toLowerCase() === 'mtn' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                            order.network?.toLowerCase().includes('at') ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                          }`}>
                            {order.network || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                            order.status === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                            order.status === 'processing' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">GHS {order.total}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105" 
                            aria-label="Expand order details"
                          >
                            {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0">
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 border-l-4 border-indigo-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-4">Order Information</h4>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Status:</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{order.status}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Total:</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">GHS {order.total}</span>
                                  </div>
                                  {order.customer_email && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Email:</span>
                                      <span className="font-semibold text-gray-900 dark:text-gray-100">{order.customer_email}</span>
                                    </div>
                                  )}
                                  {order.paystack_reference && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-300">Reference:</span>
                                      <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">{order.paystack_reference}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-4">Products</h4>
                                  <div className="space-y-3">
                                    {order.products.map(product => (
                                      <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                                          <span className="font-bold text-green-600">GHS {product.pivot.price}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                          Beneficiary: {product.pivot.beneficiary_number || 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}