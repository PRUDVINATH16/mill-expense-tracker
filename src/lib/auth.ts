// Authentication utilities for PIN-based access

const CORRECT_PIN = '9494';
const AUTH_KEY = 'authentication_key';
const AUTH_EXPIRY_DAYS = 7;

export interface AuthState {
  isAuthenticated: boolean;
  expiresAt: number;
}

export function verifyPin(pin: string): boolean {
  return pin === CORRECT_PIN;
}

export function saveAuthState(): void {
  const expiresAt = Date.now() + AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const authState: AuthState = {
    isAuthenticated: true,
    expiresAt,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
}

export function checkAuthState(): boolean {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return false;

    const authState: AuthState = JSON.parse(stored);
    
    if (Date.now() > authState.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }

    return authState.isAuthenticated;
  } catch {
    return false;
  }
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_KEY);
}
