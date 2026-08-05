let cachedToken: string | null = null;

function getTokenFromMeta(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export function getCsrfTokenSync(): string {
  if (!cachedToken) cachedToken = getTokenFromMeta();
  return cachedToken;
}

export async function getCsrfToken(): Promise<string> {
  return getCsrfTokenSync();
}

export async function getCsrfTokenPreemptive(): Promise<string> {
  cachedToken = getTokenFromMeta();
  return cachedToken;
}

export async function refreshCsrfToken(): Promise<string> {
  return getCsrfTokenPreemptive();
}

export function invalidateCsrfCache(): void {
  cachedToken = null;
}
