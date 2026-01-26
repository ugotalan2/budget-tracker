import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Budget Tracker',
  description: 'Track your expenses and stay within your budget.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
