import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import BudgetsClient from './BudgetsClient';

export default async function BudgetsPage() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    redirect('/');
  }

  return <BudgetsClient />;
}
