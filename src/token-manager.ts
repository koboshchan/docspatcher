import { exec } from 'child_process';
import { getCachedToken, setCachedToken, getWebAppUrl, clearCachedToken } from './config-store.js';

let currentToken: string | null = null;
let tokenExpiresAt: number = 0;

let pendingResolvers: ((token: string) => void)[] = [];

// Initialize by loading cached token
const cached = getCachedToken();
if (cached.token && cached.tokenExpiresAt) {
  currentToken = cached.token;
  tokenExpiresAt = cached.tokenExpiresAt;
}

export function isTokenValid(): boolean {
  if (!currentToken) return false;
  // Expired or within 60 seconds of expiring
  return tokenExpiresAt > Date.now() + 60 * 1000;
}

export function setToken(token: string): void {
  currentToken = token;
  tokenExpiresAt = Date.now() + 3500 * 1000; // 1 hour minus 100s buffer
  setCachedToken(token, tokenExpiresAt);
  
  // Resolve any pending requests waiting for a token
  const resolvers = [...pendingResolvers];
  pendingResolvers = [];
  for (const resolve of resolvers) {
    resolve(token);
  }
}

export function invalidateToken(): void {
  currentToken = null;
  tokenExpiresAt = 0;
  clearCachedToken();
}

export async function getOrRefreshToken(): Promise<string> {
  if (isTokenValid() && currentToken) {
    return currentToken;
  }

  // Double check config file in case it was updated by another process/tab
  const cached = getCachedToken();
  if (cached.token && cached.tokenExpiresAt && cached.tokenExpiresAt > Date.now() + 60 * 1000) {
    currentToken = cached.token;
    tokenExpiresAt = cached.tokenExpiresAt;
    return currentToken;
  }

  const webAppUrl = getWebAppUrl();
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error(
      'Google Apps Script Web App URL is not configured. Please open http://localhost:3000 in your browser to configure it.'
    );
  }

  console.log('No valid Google token. Opening Apps Script Web App for auto-auth...');
  
  // Clean URL
  const authUrl = webAppUrl.trim();
  
  try {
    // Open in browser
    const cmd = process.platform === 'win32' ? `start "" "${authUrl}"` : `open "${authUrl}"`;
    exec(cmd);
  } catch (err) {
    console.error('Failed to open browser automatically. Please open this URL manually:', authUrl);
  }

  // Wait for token sync
  return new Promise<string>((resolve, reject) => {
    pendingResolvers.push(resolve);

    // Timeout after 60s
    setTimeout(() => {
      const index = pendingResolvers.indexOf(resolve);
      if (index !== -1) {
        pendingResolvers.splice(index, 1);
        reject(new Error('Authentication timeout. Please open ' + authUrl + ' and check if the token synced.'));
      }
    }, 60000);
  });
}
