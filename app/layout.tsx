import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import ClerkThemeProvider from '@/components/layout/ClerkThemeProvider';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ClerkProvider>
            <ClerkThemeProvider>
              <ToastProvider>
                <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {/* Desktop Sidebar - hidden on mobile */}
                  <Sidebar />

                  {/* Main Content */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Desktop TopNav - hidden on mobile */}
                    <div className="hidden md:block">
                      <TopNav />
                    </div>

                    {/* Mobile TopBar - hidden on desktop */}
                    <MobileTopBar />

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
                      {children}
                    </main>

                    {/* Mobile Bottom Nav - hidden on desktop */}
                    <BottomNav />
                  </div>
                </div>
              </ToastProvider>
            </ClerkThemeProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
