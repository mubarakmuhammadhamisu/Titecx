// ─────────────────────────────────────────────
// Client-side auth helpers (localStorage-based)
// Swap these out for Supabase calls when backend is ready.
// ─────────────────────────────────────────────

import { DemoUser } from './users';

const SESSION_KEY = 'learnify_user';

/** Save user to localStorage after login */
export function saveSession(user: DemoUser): void {
  if (typeof window === 'undefined') return;
  // Never store the password in the session
  const { password: _, ...safe } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
}

/** Read current user from localStorage */
export function getSession(): Omit<DemoUser, 'password'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear session on logout */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/** Check if a user is currently logged in */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}
