'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Receipt,
  Target,
  FolderOpen,
  Wallet,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  // Don't show sidebar if not signed in
  if (!isSignedIn) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/expenses', icon: Receipt, label: 'Expenses' },
    { href: '/budgets', icon: Target, label: 'Budgets' },
    { href: '/categories', icon: FolderOpen, label: 'Categories' },
    { href: '/accounts', icon: Wallet, label: 'Accounts' },
  ];

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Budget Tracker
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
