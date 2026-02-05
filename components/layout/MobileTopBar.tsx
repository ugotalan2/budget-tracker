'use client';

import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { UserButton, useAuth, SignInButton } from '@clerk/nextjs';
import ThemeSettings from './ThemeSettings';
import Button from '@/components/ui/Button';

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
        <div className="flex items-center gap-2">
          <ThemeSettings />
          {isSignedIn ? (
            <>
              <Link
                href="/settings"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
