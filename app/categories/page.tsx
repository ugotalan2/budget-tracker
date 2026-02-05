import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    redirect('/');
  }

  return <CategoriesClient />;
}
