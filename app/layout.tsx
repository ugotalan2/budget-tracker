import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import ClerkThemeProvider from '@/components/layout/ClerkThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Budget Tracker',
  description: 'Track your expenses and manage budgets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ClerkThemeProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <TopNav />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
