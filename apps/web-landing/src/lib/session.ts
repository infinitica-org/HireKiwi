'use client';

export type UserRole =
  | 'STUDENT'
  | 'TPO'
  | 'ADMIN'
  | 'SYSTEM_ADMIN'
  | 'EMPLOYER_ADMIN'
  | 'EMPLOYER_RECRUITER'
  | 'EMPLOYER_VIEWER'
  | 'EMPLOYER_GUEST';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export interface SessionInfo {
  isLoggedIn: boolean;
  role: UserRole | null;
  portalUrl: string | null;
}

export function getClientSession(): SessionInfo {
  if (typeof window === 'undefined') {
    return { isLoggedIn: false, role: null, portalUrl: null };
  }

  try {
    // Check localStorage or cookie for smart_access_token or access_token
    let token: string | null = null;
    try {
      token = localStorage.getItem('smart_access_token') || localStorage.getItem('access_token');
    } catch {
      // Storage restricted
    }

    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )smart_access_token=([^;]*)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return { isLoggedIn: false, role: null, portalUrl: null };
    }

    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
      return { isLoggedIn: false, role: null, portalUrl: null };
    }

    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      role?: UserRole;
      exp?: number;
    };

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { isLoggedIn: false, role: null, portalUrl: null };
    }

    const role = payload.role ?? null;
    let portalUrl: string | null = null;

    const studentBase = process.env.NEXT_PUBLIC_STUDENT_URL ?? 'http://localhost:3001';
    const tpoBase = process.env.NEXT_PUBLIC_TPO_URL ?? 'http://localhost:3002';
    const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3003';
    const companyBase = process.env.NEXT_PUBLIC_COMPANY_URL ?? 'http://localhost:3008';

    if (role === 'STUDENT') {
      portalUrl = `${studentBase}/dashboard`;
    } else if (role === 'TPO') {
      portalUrl = `${tpoBase}/workspace`;
    } else if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') {
      portalUrl = `${adminBase}/dashboard`;
    } else if (
      role === 'EMPLOYER_ADMIN' ||
      role === 'EMPLOYER_RECRUITER' ||
      role === 'EMPLOYER_VIEWER' ||
      role === 'EMPLOYER_GUEST'
    ) {
      portalUrl = `${companyBase}/dashboard`;
    }

    return {
      isLoggedIn: true,
      role,
      portalUrl,
    };
  } catch {
    return { isLoggedIn: false, role: null, portalUrl: null };
  }
}
