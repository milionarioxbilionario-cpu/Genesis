const AUTH_STORAGE_KEY = 'genesis_auth';

export function saveAuthSession(session) {
  if (typeof window === 'undefined') return;
  const payload = {
    token: session?.token || '',
    user: session?.user || null,
    savedAt: Date.now()
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.user ? parsed : null;
  } catch (error) {
    console.warn('Failed to read auth session', error);
    return null;
  }
}

export function getAuthToken() {
  const session = getAuthSession();
  return session?.token || null;
}

export function getPortalRoute(role) {
  // Nota: super_admin intencionalmente sem rota neste bundle — vive no admin-frontend.
  if (role === 'cashier') return '/cashier';
  if (role === 'owner') return '/owner';
  return '/login';
}
