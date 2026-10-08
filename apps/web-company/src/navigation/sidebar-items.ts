import type { LucideIcon } from 'lucide-react';
import { Briefcase, LayoutDashboard, UserCheck, Users } from 'lucide-react';

export type CompanyNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
};

export const companyNavItems: CompanyNavItem[] = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Jobs', url: '/jobs', icon: Briefcase },
  { title: 'Applicants', url: '/applicants', icon: UserCheck },
  { title: 'Search students', url: '/students', icon: Users },
];

/** Whether a nav link is current; `/` only matches the home page itself. */
export function isCompanyNavActive(pathname: string, url: string): boolean {
  if (url === '/') return pathname === '/';
  return pathname === url || pathname.startsWith(`${url}/`);
}
