import React, { useState } from "react";
import { AdminLayout } from "../../layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { PageProps, User, Transaction } from '@/types';
import { ArrowLeft, Calendar, DollarSign, FileText } from "lucide-react";
import { Link, router } from '@inertiajs/react';
import Pagination from '@/components/pagination';

interface PaginatedTransactions {
  data: Transaction[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface UserTransactionsPageProps extends PageProps {
  user: User;
  transactions: PaginatedTransactions;
  filterType: string;
  filterDateFrom: string;
  filterDateTo: string;
}

const UserTransactionsPage = ({ auth, user, transactions, filterType: initType, filterDateFrom: initFrom, filterDateTo: initTo }: UserTransactionsPageProps) => {
  const [filterType, setFilterType] = useState(initType);
  const [dateFrom, setDateFrom] = useState(initFrom);

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (filterType) params.type = filterType;
    if (dateFrom) params.date_from = dateFrom;
    router.get(route('admin.users.transactions', user.id), params, { preserveState: true, replace: true });
  };

  const resetFilters = () => {
    setFilterType('');
    setDateFrom('');
    router.get(route('admin.users.transactions', user.id), {}, { preserveState: true, replace: true });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      wallet_topup: "bg-blue-100 text-blue-800",
      order_payment: "bg-purple-100 text-purple-800",
      agent_fee: "bg-orange-100 text-orange-800",
      refund: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <AdminLayout
      user={auth.user}
      header={
        <div className="flex items-center gap-4">
          <Link href={route('admin.users')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-tight">
            Transaction History - {user.name}
          </h2>
        </div>
      }
    >
      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">User Name</h3>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</h3>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</h3>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user.phone}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</h3>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">{user.role}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Wallet Balance</h3>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">₵{user.wallet_balance || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Transactions</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{transactions.total}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Amount</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₵{transactions.data.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed Amount</h3>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₵{transactions.data.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          className="border rounded px-3 py-2 w-full sm:w-48 text-sm"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="topup">Wallet Top Up</option>
          <option value="order">Order Purchase</option>
          <option value="agent_fee">Agent Fee</option>
          <option value="refund">Refund</option>
          <option value="credit">Admin Credit</option>
          <option value="debit">Admin Debit</option>
        </select>
        <input
          type="date"
          className="border rounded px-3 py-2 w-full sm:w-40 text-sm"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />
        <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Search</button>
        <button onClick={resetFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">Reset</button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
        </div>

        {transactions.data.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.data.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₵{parseFloat(transaction.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {transactions.data.map((transaction) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(transaction.type)}
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      ₵{parseFloat(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900">{transaction.description}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">This user hasn't made any transactions yet.</p>
          </div>
        )}
      </div>

      <Pagination data={transactions} />
    </AdminLayout>
  );
};

export default UserTransactionsPage;
