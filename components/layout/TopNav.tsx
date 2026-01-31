'use client';

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import ThemeSettings from '@/components/layout/ThemeSettings';
import Button from '@/components/ui/Button';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/budgets': 'Budgets',
  '/settings': 'Settings',
};

export default function TopNav() {
  const pathname = usePathname();
  const pageLabel = pageLabels[pathname] || '';

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        {pageLabel}
      </h1>

      <div className="flex items-center gap-3">
        <ThemeSettings />

        <SignedOut>
          <SignUpButton>
            <Button variant="secondary" size="sm">
              Sign Up
            </Button>
          </SignUpButton>
          <SignInButton>
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
}
