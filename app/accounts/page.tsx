import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AccountsClient from './AccountsClient';

export default async function AccountsPage() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    redirect('/');
  }

  return <AccountsClient />;
}
