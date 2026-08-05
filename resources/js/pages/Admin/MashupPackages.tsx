import { AdminLayout } from '../../layouts/admin-layout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import React, { useState } from 'react';

interface MashupPackage {
  id: number;
  name: string;
  size: string;
  price: number;
  is_active: boolean;
}

interface MashupOrder {
  id: number;
  beneficiary_number: string;
  amount: number;
  status: string;
  paystack_reference: string;
  created_at: string;
  user: { id: number; name: string; email: string };
  package: { id: number; name: string; size: string };
}

interface Props extends PageProps {
  packages: MashupPackage[];
  orders: { data: MashupOrder[] };
  flash?: { success?: string };
}

export default function MashupPackages({ auth, packages, orders }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MashupPackage | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: '',
    size: '',
    price: '',
    is_active: true,
  });

  const flash = usePage<Props>().props.flash;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.mashup-packages.store'), {
      onSuccess: () => { reset(); setShowAddModal(false); },
    });
  };

  const openEdit = (pkg: MashupPackage) => {
    setEditingPackage(pkg);
    setData({ name: pkg.name, size: pkg.size, price: pkg.price.toString(), is_active: pkg.is_active });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    put(route('admin.mashup-packages.update', editingPackage.id), {
      onSuccess: () => { reset(); setEditingPackage(null); },
    });
  };

  const handleDelete = (pkg: MashupPackage) => {
    if (!confirm('Delete this package?')) return;
    router.delete(route('admin.mashup-packages.delete', pkg.id));
  };

  const updateOrderStatus = (orderId: number, status: string) => {
    router.put(route('admin.mashup-orders.updateStatus', orderId), { status });
  };

  // Bulk selection
  const toggleSelect = (id: number) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.data.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.data.map(o => o.id));
    }
  };

  const handleBulkStatus = () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    if (!confirm(`Change status of ${selectedOrders.length} order(s) to "${bulkStatus}"?`)) return;
    router.put(route('admin.mashup-orders.bulkUpdateStatus'), {
      order_ids: selectedOrders,
      status: bulkStatus,
    }, {
      onSuccess: () => { setSelectedOrders([]); setBulkStatus(''); },
    });
  };

  const handleExport = () => {
    if (selectedOrders.length === 0) return;
    // Use a form post that triggers a file download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = route('admin.mashup-orders.export');

    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_token';
    csrfInput.value = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
    form.appendChild(csrfInput);

    selectedOrders.forEach(id => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'order_ids[]';
      input.value = id.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <AdminLayout user={auth.user} header={<h2 className="font-semibold text-2xl text-gray-800 dark:text-gray-100">Mashup Packages</h2>}>
      <Head title="Mashup Packages" />

      <div className="py-6 px-2 sm:py-10 sm:px-4 lg:px-8 space-y-8">
        {flash?.success && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg">{flash.success}</div>
        )}

        {/* Packages Section */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Packages</h3>
            <button
              onClick={() => { reset(); setShowAddModal(true); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Package
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Size</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {packages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">{pkg.id}</td>
                    <td className="px-4 py-3">{pkg.name}</td>
                    <td className="px-4 py-3">{pkg.size}</td>
                    <td className="px-4 py-3">GHS {pkg.price}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {pkg.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => openEdit(pkg)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      <button onClick={() => handleDelete(pkg)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No packages yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Mashup Orders {selectedOrders.length > 0 && <span className="text-sm text-indigo-600">({selectedOrders.length} selected)</span>}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="text-sm border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Bulk Status...</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleBulkStatus}
                disabled={!bulkStatus || selectedOrders.length === 0}
                className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium"
              >
                Apply Status
              </button>
              <button
                onClick={handleExport}
                disabled={selectedOrders.length === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={orders.data.length > 0 && selectedOrders.length === orders.data.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Package</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.data.map(order => (
                  <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedOrders.includes(order.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">{order.id}</td>
                    <td className="px-4 py-3">{order.user?.name}</td>
                    <td className="px-4 py-3">{order.package?.name} ({order.package?.size})</td>
                    <td className="px-4 py-3">{order.beneficiary_number}</td>
                    <td className="px-4 py-3">GHS {order.amount}</td>
                    <td className="px-4 py-3 text-xs font-mono">{order.paystack_reference || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orders.data.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Mashup Package</h3>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                <input type="text" value={data.size} onChange={e => setData('size', e.target.value)} required placeholder="e.g. 5GB + 2000 mins"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (GHS)</label>
                <input type="number" step="0.01" value={data.price} onChange={e => setData('price', e.target.value)} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {processing ? 'Adding...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Mashup Package</h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                <input type="text" value={data.size} onChange={e => setData('size', e.target.value)} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (GHS)</label>
                <input type="number" step="0.01" value={data.price} onChange={e => setData('price', e.target.value)} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setEditingPackage(null); reset(); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
