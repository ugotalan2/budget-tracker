'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import MobileMenu from './MobileMenu';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/budgets': 'Budgets',
  '/categories': 'Categories',
  '/accounts': 'Accounts',
  '/settings': 'Settings',
};

export default function MobileTopBar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const title = pageTitles[pathname] || 'Budget Tracker';

  return (
    <div className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        {isSignedIn && <MobileMenu />}
      </div>
    </div>
  );
}
