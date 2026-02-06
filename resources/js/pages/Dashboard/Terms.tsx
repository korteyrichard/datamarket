import DashboardLayout from '../../layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function Terms({ auth }: PageProps) {
  return (
    <DashboardLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Terms & Conditions</h2>}
    >
      <Head title="Terms & Conditions" />

      <div className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Important Terms & Conditions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please read carefully before using our services</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Complaint Policy */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                      1. Complaint Reporting Policy
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>All complaints must be reported within 24 hours of the transaction.</strong> 
                      Failure to report issues within this timeframe means we cannot provide assistance or refunds. 
                      This policy ensures timely resolution and proper investigation of any problems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Multiple Orders Policy */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
                      2. Multiple Orders Restriction
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>Do not place multiple orders for the same phone number.</strong> 
                      Our system prevents duplicate transactions to the same number. If you attempt to place multiple orders 
                      for the same number, you will lose your money as the system does not allow such transactions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Important Notice
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      By using our services, you acknowledge that you have read, understood, and agree to these terms and conditions. 
                      These policies are in place to ensure fair usage and protect both our customers and our service integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}