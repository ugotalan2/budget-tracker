'use client';

import { useAuth } from '@clerk/nextjs';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  // If signed in, render nothing while the redirect happens
  if (isSignedIn) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Budget Tracker
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Track your expenses, manage budgets, and achieve your financial goals
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <SignUpButton>
            <Button variant="secondary" size="md">
              Sign Up
            </Button>
          </SignUpButton>
          <SignInButton>
            <Button variant="primary" size="md">
              Sign In
            </Button>
          </SignInButton>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Track Expenses
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Easily add and categorize your daily expenses
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Set Budgets
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create monthly budgets and track your spending
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              View Insights
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Analyze your spending with charts and reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
