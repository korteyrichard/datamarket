import React, { useState } from 'react';
import { AdminLayout } from '../../layouts/admin-layout';
import { Head, usePage, router } from '@inertiajs/react';
import Pagination from '@/components/pagination';

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
  api_status: 'disabled' | 'success' | 'failed';
  created_at: string;
  network?: string;
  beneficiary_number?: string;
  customer_email?: string;
  paystack_reference?: string;
  products: Product[];
  user: {
    id: number;
    name: string;
    email: string;
  };
  commission?: {
    id: number;
    amount: number;
    status: string;
  };
}

interface PaginatedOrders {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

interface AdminOrdersPageProps {
  orders: PaginatedOrders;
  auth: any;
  filterNetwork: string;
  filterStatus: string;
  searchOrderId: string;
  searchBeneficiaryNumber: string;
  dailySales: number;
  dailyCommissions: number;
  [key: string]: any;
}

export default function AdminOrders() {
  const {
    orders,
    auth,
    filterNetwork: initialNetworkFilter,
    filterStatus: initialStatusFilter,
    searchOrderId,
    searchBeneficiaryNumber,
    dailySales,
    dailyCommissions,
  } = usePage<AdminOrdersPageProps>().props;

  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [networkFilter, setNetworkFilter] = useState(initialNetworkFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [orderIdSearch, setOrderIdSearch] = useState(searchOrderId);
  const [beneficiarySearch, setBeneficiarySearch] = useState(searchBeneficiaryNumber);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const networks = Array.from(new Set(orders.data.map(o => o.network).filter(Boolean)));

  const handleFilterChange = (filterName: string, value: string) => {
    const params: Record<string, string | undefined> = {};
    params[filterName] = value || undefined;
    
    if (filterName === 'network') {
      setNetworkFilter(value);
    } else if (filterName === 'status') {
      setStatusFilter(value);
    }
    
    router.get(route('admin.orders'), params, { preserveState: true, replace: true });
  };



  const handleExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getNetworkColor = (network?: string) => {
    if (!network) return 'bg-gray-200 text-gray-700';
    const map: Record<string, string> = {
      telecel: 'bg-red-100 text-red-700',
      mtn: 'bg-yellow-100 text-yellow-800',
      'at data (instant)': 'bg-blue-100 text-blue-700',
      'at (big packages)': 'bg-blue-100 text-blue-700',
    };
    return map[network.toLowerCase()] || 'bg-gray-200 text-gray-700';
  };

  const getApiStatusColor = (apiStatus: 'disabled' | 'success' | 'failed') => {
    const map: Record<string, string> = {
      disabled: 'bg-gray-100 text-gray-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[apiStatus];
  };

  const handleDeleteOrder = (orderId: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      router.delete(route('admin.orders.delete', orderId), {
        onSuccess: () => router.reload(),
        onError: () => alert('Failed to delete order.'),
      });
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    router.put(route('admin.orders.updateStatus', orderId), { status: newStatus }, {
      onSuccess: () => router.reload(),
      onError: () => alert('Failed to update order status.'),
    });
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(selectedOrders.length === orders.data.length ? [] : orders.data.map(o => o.id));
  };

  const handleBulkStatusUpdate = () => {
    if (selectedOrders.length === 0 || !bulkStatus) return;
    
    router.put(route('admin.orders.bulkUpdateStatus'), {
      order_ids: selectedOrders,
      status: bulkStatus
    }, {
      onSuccess: () => {
        setSelectedOrders([]);
        setBulkStatus('');
        router.reload();
      },
      onError: () => alert('Failed to update order statuses.'),
    });
  };

  return (
    <AdminLayout
      user={auth?.user}
      header={<h2 className="text-3xl font-bold text-gray-800 dark:text-white">Orders</h2>}
    >
      <Head title="Admin Orders" />
      <div className="max-w-6xl mx-auto py-10 px-2 sm:px-4">
        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Daily Sales</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">GHS {Number(dailySales || 0).toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Daily Commissions</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">GHS {Number(dailyCommissions || 0).toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedOrders.length} order(s) selected
              </span>
              <div className="flex gap-2">
                <select
                  className="px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-sm"
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                >
                  <option value="">Change status to...</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = route('admin.orders.export');
                    form.style.display = 'none';
                    
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                    form.appendChild(csrfInput);
                    
                    selectedOrders.forEach(orderId => {
                      const input = document.createElement('input');
                      input.type = 'hidden';
                      input.name = 'order_ids[]';
                      input.value = orderId.toString();
                      form.appendChild(input);
                    });
                    
                    document.body.appendChild(form);
                    form.submit();
                    document.body.removeChild(form);
                  }}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search by Order ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:ring focus:ring-blue-500 text-sm"
                placeholder="Enter order ID"
                value={orderIdSearch}
                onChange={e => {
                  setOrderIdSearch(e.target.value);
                  router.get(route('admin.orders'), {
                    order_id: e.target.value || undefined
                  }, { preserveState: true, replace: true });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search by Beneficiary Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:ring focus:ring-blue-500 text-sm"
                placeholder="Enter beneficiary number"
                value={beneficiarySearch}
                onChange={e => {
                  setBeneficiarySearch(e.target.value);
                  router.get(route('admin.orders'), {
                    beneficiary_number: e.target.value || undefined
                  }, { preserveState: true, replace: true });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Network</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:ring focus:ring-blue-500 text-sm"
                value={networkFilter}
                onChange={(e) => handleFilterChange('network', e.target.value)}
              >
                <option value="">All Networks</option>
                {networks.map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Status</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white shadow-sm focus:ring focus:ring-blue-500 text-sm"
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {orders.data.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-6 rounded-xl text-center shadow-md">
            No orders found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <table className="min-w-[600px] w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="uppercase text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.data.length && orders.data.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Order #</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">User</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Date</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Network</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Status</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">API Status</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Total</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4">Commission</th>
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition">
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 font-semibold">{order.id}</td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="text-sm">
                          <div className="font-medium">{order.user.name}</div>
                          <div className="text-gray-500 text-xs">{order.user.email}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="text-sm">
                          <div className="font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-5 py-3 sm:py-4 rounded ${getNetworkColor(order.network)} font-medium`}>
                        {order.network || '-'}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <select
                          className="px-2 py-1 rounded-md text-xs dark:bg-gray-800 bg-gray-100"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApiStatusColor(order.api_status)}`}>
                          {order.api_status.charAt(0).toUpperCase() + order.api_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 font-semibold">GHS {order.total}</td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 font-semibold">
                        {order.commission ? `GHS ${order.commission.amount}` : '-'}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-right space-x-2 sm:space-x-3">
                        <button
                          onClick={() => handleExpand(order.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm"
                        >
                          {expandedOrder === order.id ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-500 hover:underline text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {expandedOrder === order.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                        <td colSpan={10} className="px-3 sm:px-6 py-4 sm:py-5">
                          <div className="space-y-2 text-xs sm:text-sm">
                            <p><strong>Status:</strong> {order.status}</p>
                            <p><strong>API Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApiStatusColor(order.api_status)}`}>
                              {order.api_status.charAt(0).toUpperCase() + order.api_status.slice(1)}
                            </span></p>
                            {order.customer_email && (
                              <p><strong>Customer Email:</strong> {order.customer_email}</p>
                            )}
                            {order.paystack_reference && (
                              <p><strong>Paystack Reference:</strong> <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{order.paystack_reference}</span></p>
                            )}
                            <p><strong>Products:</strong></p>
                            <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                              {order.products.map((product) => (
                                <li key={product.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                  <span>{product.name} - GHS {product.pivot.price}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Beneficiary: {product.pivot.beneficiary_number || '-'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <Pagination data={orders} />
      </div>
    </AdminLayout>
  );
}
