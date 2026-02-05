'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Home, DollarSign, TrendingUp, FolderOpen, Wallet } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/expenses', icon: DollarSign, label: 'Expenses' },
  { href: '/budgets', icon: TrendingUp, label: 'Budgets' },
  { href: '/categories', icon: FolderOpen, label: 'Categories' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Don't show bottom nav if not signed in
  if (!isSignedIn) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
