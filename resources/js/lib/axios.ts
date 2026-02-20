/**
 * Axios Configuration
 * 
 * This file sets up axios with:
 * - Automatic CSRF token handling
 * - Request/response interceptors
 * - Error handling with token refresh on mismatch
 * - Credentials inclusion for session management
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { getCsrfToken, getCsrfTokenPreemptive, invalidateCsrfCache } from '@/utils/csrf';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 30000,
  withCredentials: true, // Include cookies for cookie-based authentication
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

// Flag to prevent infinite retry loops
let isRefreshingToken = false;
let tokenRefreshPromise: Promise<string> | null = null;

/**
 * Request Interceptor
 * Automatically adds CSRF token to all non-GET requests
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    // Only add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      // Check if we should preemptively refresh the token
      // For critical operations (payment-related), always get fresh token
      const isCriticalOperation = config.url?.includes('/wallet/') || 
                                  config.url?.includes('/payment') ||
                                  config.url?.includes('/topup');

      const csrfToken = isCriticalOperation 
        ? await getCsrfTokenPreemptive()
        : await getCsrfToken();

      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles CSRF token mismatch errors by refreshing the token and retrying
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Reset refresh flag on successful response
    isRefreshingToken = false;
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    // Check if this is a CSRF token mismatch error
    const isCsrfError = 
      error.response?.status === 419 || // Laravel's CSRF expired status
      error.response?.data?.message?.toLowerCase().includes('csrf') ||
      error.response?.data?.message?.toLowerCase().includes('token mismatch');

    // Check if this is a token validation error (419 is Laravel's CSRF error code)
    const isTokenExpired = error.response?.status === 419;

    if ((isCsrfError || isTokenExpired) && !originalRequest._retried) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshingToken) {
        isRefreshingToken = true;
        tokenRefreshPromise = getCsrfTokenPreemptive()
          .then(() => {
            isRefreshingToken = false;
            tokenRefreshPromise = null;
            return 'refresh_complete';
          })
          .catch((refreshError) => {
            isRefreshingToken = false;
            tokenRefreshPromise = null;
            console.error('Failed to refresh CSRF token:', refreshError);
            throw refreshError;
          });
      }

      // Wait for token refresh if one is already in progress
      if (tokenRefreshPromise) {
        try {
          await tokenRefreshPromise;
        } catch (err) {
          console.error('Token refresh failed:', err);
          // If refresh fails, return the original error
          return Promise.reject(error);
        }
      }

      // Mark request as retried to avoid infinite loops
      originalRequest._retried = true;

      // Retry the request with the new token
      const csrfToken = await getCsrfToken();
      originalRequest.headers['X-CSRF-TOKEN'] = csrfToken;

      return axiosInstance(originalRequest);
    }

    // Handle logout on authentication errors
    if (error.response?.status === 401) {
      invalidateCsrfCache();
      // Optionally redirect to login page
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
