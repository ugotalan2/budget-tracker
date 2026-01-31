'use client';

import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function ThemeSettings() {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Add keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();

        // Cycle through themes: light -> dark -> system -> light
        const themeOrder: Array<'light' | 'dark' | 'system'> = [
          'light',
          'dark',
          'system',
        ];
        const currentIndex = themeOrder.indexOf(themeMode);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setThemeMode(themeOrder[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [themeMode, setThemeMode]);

  const options = [
    { mode: 'light' as const, label: 'Light', icon: Sun },
    { mode: 'dark' as const, label: 'Dark', icon: Moon },
    { mode: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Theme button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        title="Theme settings"
      >
        {themeMode === 'light' && <Sun className="h-4 w-4" />}
        {themeMode === 'dark' && <Moon className="h-4 w-4" />}
        {themeMode === 'system' && <Monitor className="h-4 w-4" />}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-10 right-0 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              THEME
            </div>
            {options.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => {
                  setThemeMode(mode);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  themeMode === mode
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{label}</span>
                {themeMode === mode && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
