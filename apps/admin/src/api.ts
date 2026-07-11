import { EmergencyAiClient } from '@emergencyai/sdk';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:3000/api/v1';

const TOKEN_KEY = 'emergencyai_admin_token';

export const client = new EmergencyAiClient({
  baseUrl: BASE_URL,
  getToken: () => localStorage.getItem(TOKEN_KEY),
  onTokens: (t) => localStorage.setItem(TOKEN_KEY, t.accessToken),
});

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}
