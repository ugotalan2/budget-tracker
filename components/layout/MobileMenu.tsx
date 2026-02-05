'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Settings,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { createPortal } from 'react-dom';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowThemeMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const menuButton = (
    <button
      ref={buttonRef}
      onClick={() => setIsOpen(!isOpen)}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Menu"
    >
      <MoreVertical className="h-5 w-5" />
    </button>
  );

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="h-4 w-4" />;
    if (theme === 'light') return <Sun className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const menuContent = isOpen && buttonRef.current && (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: buttonRef.current.getBoundingClientRect().bottom + 8,
        right: 16,
        zIndex: 9999,
      }}
      className="w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="py-2">
        {showThemeMenu ? (
          <>
            {/* Back button */}
            <button
              onClick={() => setShowThemeMenu(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Back</span>
            </button>

            <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

            {/* Theme options */}
            <button
              onClick={() => handleThemeSelect('light')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('dark')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('system')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Monitor className="h-4 w-4" />
              <span>System</span>
              {theme === 'system' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Theme Toggle */}
            <button
              onClick={() => setShowThemeMenu(true)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                {getThemeIcon()}
                <span>Theme</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Settings Link */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

            {/* User Profile */}
            <div className="flex items-center gap-3 px-4 py-2">
              <UserButton afterSignOutUrl="/" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Account
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {menuButton}
      {typeof window !== 'undefined' &&
        menuContent &&
        createPortal(menuContent, document.body)}
    </>
  );
}
