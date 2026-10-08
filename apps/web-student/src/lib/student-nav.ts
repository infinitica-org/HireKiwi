import {
  Bookmark,
  ClipboardCheck,
  BriefcaseBusiness,
  CircleUserRound,
  Compass,
  House,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface StudentNavLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface StudentNavItem extends StudentNavLink {
  /** Related pages that open from this item's hover menu instead of sitting in the bar. */
  children?: StudentNavLink[];
}

// Pages live under /student/… (root paths redirect there), so link and match on the real paths.
export const STUDENT_NAV: StudentNavItem[] = [
  { name: 'Home', href: '/student/dashboard', icon: House },
  {
    name: 'Jobs',
    href: '/student/jobs',
    icon: BriefcaseBusiness,
    children: [
      { name: 'Saved', href: '/student/jobs?view=saved', icon: Bookmark },
      { name: 'Applied', href: '/student/applications', icon: ClipboardCheck },
      { name: 'Opportunities', href: '/student/opportunities', icon: Compass },
    ],
  },

  { name: 'My profile', href: '/student/profile', icon: CircleUserRound },
];

export const STUDENT_SETTINGS_LINK: StudentNavLink = {
  name: 'Settings',
  href: '/student/settings',
  icon: Settings,
};

/** Every link, flattened in display order (used by the mobile menu). */
export const STUDENT_NAV_FLAT: StudentNavLink[] = [
  ...STUDENT_NAV.flatMap((item) => [item, ...(item.children ?? [])]),
  STUDENT_SETTINGS_LINK,
];

export function isStudentNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** A top-level item is lit on its own page or on any page in its hover menu. */
export function isStudentNavItemLit(pathname: string, item: StudentNavItem): boolean {
  return (
    isStudentNavActive(pathname, item.href) ||
    (item.children ?? []).some((child) => isStudentNavActive(pathname, child.href))
  );
}
