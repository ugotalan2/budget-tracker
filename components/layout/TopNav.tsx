'use client';

import { UserButton, useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import ThemeSettings from './ThemeSettings';
import Button from '@/components/ui/Button';

export default function TopNav() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-end gap-4 px-6">
        <ThemeSettings />
        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                rootBox: 'after-sign-out-url-/',
              },
            }}
          />
        ) : (
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        )}
      </div>
    </header>
  );
}
