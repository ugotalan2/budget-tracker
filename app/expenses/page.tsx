import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ExpensesClient from './ExpensesClient';

export default async function ExpensesPage() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    redirect('/');
  }

  return <ExpensesClient />;
}
