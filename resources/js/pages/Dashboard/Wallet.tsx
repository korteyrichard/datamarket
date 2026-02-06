import React,{useState} from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, router,usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { User } from '@/types';

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
      const [showAddModal, setShowAddModal] = useState(false);
      const [addAmount, setAddAmount] = useState('');
      const [isAdding, setIsAdding] = useState(false);
      const [addError, setAddError] = useState<string | null>(null);
      const [verifyingTx, setVerifyingTx] = useState<number | null>(null);



       

  const handleTopUp = () => {
    router.visit('/dashboard/wallet/add');
  };

  const handleVerifyPayment = async (reference: string, txId: number) => {
    setVerifyingTx(txId);
    try {
      const response = await fetch('/dashboard/wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ reference }),
      });
      const data = await response.json();
      if (data.success) {
        router.reload();
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (err) {
      alert('Error verifying payment');
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
                  const response = await fetch('/dashboard/wallet/add', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ amount: addAmount }),
                  });
                  const data = await response.json();
                  if (data.success && data.payment_url) {
                    // Redirect to Paystack payment page
                    window.location.href = data.payment_url;
                  } else {
                    setAddError(data.message || 'Failed to initialize payment.');
                  }
                } catch (err) {
                  setAddError('Error initializing payment.');
                } finally {
                  setIsAdding(false);
                }
              }}
            >
              <input
                type="number"
                min="10.00"
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
    
      <div className="py-8 max-w-7xl mx-auto px-4 space-y-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl shadow-xl p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-full sm:w-auto backdrop-blur-sm"
            >
              Top Up Wallet
            </button>
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.type === 'topup' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
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
                  className={`px-3 py-1 rounded text-sm sm:text-base ${
                    link.active
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
