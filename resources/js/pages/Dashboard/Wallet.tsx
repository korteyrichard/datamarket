import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { User } from '@/types';
import axios from '@/lib/axios';

interface Transaction {
  id: number;
  amount: number;
  status: string;
  type: string;
  description: string;
  reference: string;
  created_at: string;
}

interface WalletPageProps extends PageProps {
  auth: {
    user: User & {
      wallet_balance: number;
    };
  };
  transactions: {
    data: Transaction[];
    current_page: number;
    last_page: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
}





export default function Wallet({ auth, transactions }: WalletPageProps) {



  const { walletBalance: initialWalletBalance } = usePage<PageProps>().props;

  const [walletBalance, setWalletBalance] = useState(initialWalletBalance ?? 0);
  const [addAmount, setAddAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [verifyingTx, setVerifyingTx] = useState<number | null>(null);





  const handleVerifyPayment = async (reference: string, txId: number) => {
    setVerifyingTx(txId);
    try {
      const response = await axios.post('/dashboard/wallet/verify', { reference });
      const data = response.data;
      if (data.success) {
        router.reload();
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error verifying payment';
      alert(errorMessage);
    } finally {
      setVerifyingTx(null);
    }
  };

  const user = auth.user;

  return (
    <DashboardLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Wallet
        </h2>
      }
    >
      <Head title="Wallet" />


      <div className="py-8 max-w-7xl mx-auto px-4 space-y-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wide mb-1">
                  Wallet Balance
                </h3>
                <p className="text-3xl font-bold">
                  GHS {auth.user.wallet_balance}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <form
                className="flex flex-col sm:flex-row gap-3 items-end sm:items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsAdding(true);
                  setAddError(null);
                  try {
                    const response = await axios.post('/dashboard/wallet/add', { amount: addAmount });
                    const data = response.data;
                    if (data.success && data.payment_url) {
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
                <div className="w-full sm:w-48 relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-bold z-10">GHS</span>
                  <input
                    type="number"
                    min="1.00"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-white/20 bg-white text-gray-900 placeholder-gray-400 focus:border-white focus:ring-0 transition-all duration-200 shadow-inner font-medium"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={e => setAddAmount(e.target.value)}
                    required
                    disabled={isAdding}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAdding || !addAmount}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3 rounded-lg font-bold transition-all duration-200 w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Top Up Wallet'}
                </button>
              </form>
              {addError && <p className="text-white text-xs mt-2 bg-red-500 p-2 rounded border border-red-400 shadow-sm font-semibold">{addError}</p>}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Wallet Transaction History
            </h3>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="p-6">
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-tl-lg">ID</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Type</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Date</th>
                    <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">No wallet transactions found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.data.map((tx, index) => (
                      <tr key={tx.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750'}`}>
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{tx.id}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.type === 'topup' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                            tx.type === 'credit' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                              tx.type === 'debit' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                                'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                            }`}>
                            {tx.type === 'topup' ? 'Top Up' :
                              tx.type === 'credit' ? 'Credit' :
                                tx.type === 'debit' ? 'Debit' : tx.type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">GHS {Number(tx.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                            tx.status === 'pending' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                              'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                            }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {tx.status === 'pending' && tx.reference && (
                            <button
                              onClick={() => handleVerifyPayment(tx.reference, tx.id)}
                              disabled={verifyingTx === tx.id}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                              {verifyingTx === tx.id ? 'Verifying...' : 'Verify'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap justify-end gap-2 mt-4">
            {transactions.links.map((link, i) =>
              link.url ? (
                <button
                  key={i}
                  className={`px-3 py-1 rounded text-sm sm:text-base ${link.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  onClick={() => router.visit(link.url!)}
                />
              ) : null
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
