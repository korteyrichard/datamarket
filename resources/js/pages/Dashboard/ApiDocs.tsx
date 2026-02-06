import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';

interface Product {
  id: number;
  name: string;
  network: string;
  quantity: string;
}

interface ApiDocsProps extends PageProps {
  agentProducts: Record<string, Product[]>;
}

export default function ApiDocs({ auth }: ApiDocsProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { agentProducts } = usePage<ApiDocsProps>().props;

  useEffect(() => {
    const storedApiKey = localStorage.getItem('api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(route('api.docs.generate-key'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setApiKey(data.api_key);
        localStorage.setItem('api_key', data.api_key);
        setPassword('');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
  };

  return (
    <DashboardLayout
      user={auth?.user}
      header={<h2 className="font-bold text-2xl text-gray-800 dark:text-gray-200 leading-tight">API Documentation</h2>}
    >
      <Head title="API Documentation" />

      <div className="py-12 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
          
          {/* API Key Section */}
          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get Your API Key</h3>
            
            {!apiKey ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Generate API Key'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your API Key</label>
                  <div className="flex mt-1">
                    <input
                      type="text"
                      value={apiKey}
                      readOnly
                      className="flex-1 rounded-l-md border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Available Products */}
          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Available Agent Products</h3>
            <div className="space-y-4">
              {Object.entries(agentProducts).map(([network, products]) => (
                <details key={network} className="border dark:border-gray-700 rounded-lg">
                  <summary className="cursor-pointer p-4 font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800">
                    {network} ({products.length} products)
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.quantity}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {product.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">API Endpoints</h3>
            
            <div className="space-y-8">
              {/* Authentication */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Authentication</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Include your API key in the request headers:
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json`}
                  </pre>
                </div>
              </div>

              {/* Orders */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Orders</h4>
                <div className="space-y-4">
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                      <code className="text-sm">/api/orders</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Create a new order</p>
                    <details className="text-sm mb-2">
                      <summary className="cursor-pointer text-blue-600">Request Body</summary>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`{
  "product_id": 1,
  "quantity": "5GB",
  "beneficiary_number": "0241234567"
}`}
                      </pre>
                      <p className="text-xs text-gray-500 mt-2">Note: quantity must match the product's available quantity (e.g., "5GB", "10GB")</p>
                    </details>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600">Response</summary>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "status": "processing",
      "total": "25.00",
      "beneficiary_number": "0241234567",
      "network": "MTN",
      "created_at": "2024-01-01 10:00:00",
      "updated_at": "2024-01-01 10:00:00",
      "products": [
        {
          "id": 1,
          "name": "5GB MTN",
          "network": "MTN",
          "price": "25.00",
          "description": "MTN 30 Days 5GB Data Bundle",
          "pivot": {
            "order_id": 1,
            "product_id": 1,
            "quantity": 1,
            "price": "25.00",
            "beneficiary_number": "0241234567",
            "created_at": "2024-01-01 10:00:00",
            "updated_at": "2024-01-01 10:00:00"
          }
        }
      ],
      "transactions": [
        {
          "id": 1,
          "user_id": 1,
          "order_id": 1,
          "amount": "25.00",
          "type": "order",
          "status": "completed",
          "description": "API Order placed for MTN - 5GB MTN",
          "reference": "API-1-1704110400",
          "created_at": "2024-01-01 10:00:00"
        }
      ]
    },
    "transaction": {
      "id": 1,
      "user_id": 1,
      "order_id": 1,
      "amount": "25.00",
      "type": "order",
      "status": "completed",
      "description": "API Order placed for MTN - 5GB MTN",
      "reference": "API-1-1704110400"
    }
  },
  "message": "Order created successfully"
}`}
                      </pre>
                    </details>
                  </div>

                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                      <code className="text-sm">/api/orders</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Get user's orders (paginated)</p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600">Response</summary>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "user_id": 1,
        "status": "completed",
        "total": "25.00",
        "beneficiary_number": "0241234567",
        "network": "MTN",
        "created_at": "2024-01-01 10:00:00",
        "updated_at": "2024-01-01 10:05:00",
        "products": [
          {
            "id": 1,
            "name": "5GB MTN",
            "network": "MTN",
            "price": "25.00",
            "description": "MTN 30 Days 5GB Data Bundle",
            "pivot": {
              "order_id": 1,
              "product_id": 1,
              "quantity": 1,
              "price": "25.00",
              "beneficiary_number": "0241234567",
              "created_at": "2024-01-01 10:00:00",
              "updated_at": "2024-01-01 10:00:00"
            }
          }
        ],
        "transactions": [
          {
            "id": 1,
            "user_id": 1,
            "order_id": 1,
            "amount": "25.00",
            "type": "order",
            "status": "completed",
            "description": "API Order placed for MTN - 5GB MTN",
            "reference": "API-1-1704110400",
            "created_at": "2024-01-01 10:00:00"
          }
        ]
      }
    ],
    "per_page": 20,
    "total": 1,
    "last_page": 1,
    "from": 1,
    "to": 1
  }
}`}
                      </pre>
                    </details>
                  </div>

                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                      <code className="text-sm">/api/orders/{`{id}`}</code>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Get complete order details including products and transactions</p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600">Response Example</summary>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "status": "completed",
    "total": "25.00",
    "beneficiary_number": "0241234567",
    "network": "MTN",
    "created_at": "2024-01-01 10:00:00",
    "updated_at": "2024-01-01 10:05:00",
    "products": [
      {
        "id": 1,
        "name": "5GB MTN",
        "network": "MTN",
        "price": "25.00",
        "description": "MTN 30 Days 5GB Data Bundle",
        "expiry": "30 days",
        "quantity": "5GB",
        "status": "IN STOCK",
        "product_type": "customer_product",
        "pivot": {
          "order_id": 1,
          "product_id": 1,
          "quantity": 1,
          "price": "25.00",
          "beneficiary_number": "0241234567",
          "created_at": "2024-01-01 10:00:00",
          "updated_at": "2024-01-01 10:00:00"
        }
      }
    ],
    "transactions": [
      {
        "id": 1,
        "user_id": 1,
        "order_id": 1,
        "amount": "25.00",
        "type": "order",
        "status": "completed",
        "description": "API Order placed for MTN - 5GB MTN",
        "reference": "API-1-1704110400",
        "created_at": "2024-01-01 10:00:00"
      }
    ]
  }
}`}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>



              {/* Response Format */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Response Format</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">All responses follow this format:</p>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {...},
  "message": "Success message"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}