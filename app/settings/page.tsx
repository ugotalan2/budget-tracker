import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    redirect('/');
  }

  return <SettingsClient />;
}
