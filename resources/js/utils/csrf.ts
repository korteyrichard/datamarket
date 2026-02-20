/**
 * CSRF Token Management Utility
 * 
 * This module handles CSRF token management for the application.
 * It provides utilities to:
 * - Get the current CSRF token from the DOM
 * - Refresh the CSRF token from the Sanctum endpoint
 * - Handle token mismatch errors gracefully
 */

const CSRF_COOKIE_ENDPOINT = '/sanctum/csrf-cookie';

interface CsrfToken {
  value: string;
  timestamp: number;
}

let cachedToken: CsrfToken | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // Cache token for 5 minutes

/**
 * Get the CSRF token from the meta tag
 */
function getTokenFromMeta(): string {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || '';
}

/**
 * Refresh the CSRF token by calling the Sanctum endpoint
 * This ensures the token is always fresh and synchronized with the server
 */
export async function refreshCsrfToken(): Promise<string> {
  try {
    const response = await fetch(CSRF_COOKIE_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to refresh CSRF token from Sanctum endpoint');
      // Fallback to meta tag token
      return getTokenFromMeta();
    }

    // The token is set in the cookie and meta tag by Laravel's middleware
    const token = getTokenFromMeta();
    if (token) {
      cachedToken = {
        value: token,
        timestamp: Date.now(),
      };
    }

    return token;
  } catch (error) {
    console.warn('Error refreshing CSRF token:', error);
    // Fallback to meta tag token
    return getTokenFromMeta();
  }
}

/**
 * Get the current CSRF token, using cache if available
 * If cache is stale or invalid, refresh from Sanctum endpoint
 */
export async function getCsrfToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() - cachedToken.timestamp < CACHE_DURATION) {
    return cachedToken.value;
  }

  // Token not cached or cache expired, refresh it
  return await refreshCsrfToken();
}

/**
 * Get CSRF token synchronously from meta tag (for immediate use)
 * This is useful when you need the token right away without async/await
 */
export function getCsrfTokenSync(): string {
  // Return cached token if available
  if (cachedToken && cachedToken.value) {
    return cachedToken.value;
  }

  // Fallback to meta tag
  const token = getTokenFromMeta();
  if (token) {
    cachedToken = {
      value: token,
      timestamp: Date.now(),
    };
  }

  return token;
}

/**
 * Invalidate the cached token (useful after certain operations like logout)
 */
export function invalidateCsrfCache(): void {
  cachedToken = null;
}

/**
 * Get CSRF token and preemptively refresh it to avoid stale tokens
 * Useful to call before making critical requests (like payment operations)
 */
export async function getCsrfTokenPreemptive(): Promise<string> {
  // Always refresh for critical operations to ensure freshness
  return await refreshCsrfToken();
}
