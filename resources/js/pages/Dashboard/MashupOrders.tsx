import React from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, usePage, useForm } from '@inertiajs/react';

interface MashupPackage {
  id: number;
  name: string;
  size: string;
  price: number;
}

interface MashupOrder {
  id: number;
  beneficiary_number: string;
  amount: number;
  status: string;
  paystack_reference: string;
  created_at: string;
  package: MashupPackage;
}

interface Props {
  packages: MashupPackage[];
  orders: MashupOrder[];
  auth: any;
  flash?: { success?: string; error?: string };
  [key: string]: any;
}

export default function MashupOrders() {
  const { packages, orders, auth, flash } = usePage<Props>().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    mashup_package_id: '',
    beneficiary_number: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('dashboard.mashup-orders.store'), {
      onSuccess: () => reset(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout user={auth?.user} header={<h2 className="font-semibold text-xl leading-tight">Mashup Orders</h2>}>
      <Head title="Mashup Orders" />
      <div className="py-8 max-w-6xl mx-auto px-4">
        {flash?.success && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">{flash.success}</div>
        )}
        {flash?.error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">{flash.error}</div>
        )}

        {/* Order Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Place Mashup Order</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package</label>
              <select
                value={data.mashup_package_id}
                onChange={e => setData('mashup_package_id', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.size} (GHS {pkg.price})
                  </option>
                ))}
              </select>
              {errors.mashup_package_id && <p className="text-red-500 text-xs mt-1">{errors.mashup_package_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beneficiary Number</label>
              <input
                type="text"
                value={data.beneficiary_number}
                onChange={e => setData('beneficiary_number', e.target.value)}
                placeholder="e.g. 0551234567"
                maxLength={10}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
              {errors.beneficiary_number && <p className="text-red-500 text-xs mt-1">{errors.beneficiary_number}</p>}
            </div>
            <div>
              <button
                type="submit"
                disabled={processing}
                className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
              >
                {processing ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">My Mashup Orders ({orders.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No mashup orders yet.</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {order.package?.name} ({order.package?.size})
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{order.beneficiary_number}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">GHS {order.amount}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-xs font-mono">{order.paystack_reference || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
