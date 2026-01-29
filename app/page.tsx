import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('expenses').select('count');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-4 text-4xl font-bold">Budget Tracker</h1>
      {error ? (
        <p className="text-red-500">Database Error: {error.message}</p>
      ) : (
        <p className="text-green-600">✅ Database connected successfully!</p>
      )}
      <p className="mt-2 text-gray-600">
        Expenses in database: {data?.[0]?.count ?? 0}
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/expenses"
          className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Go to Expenses
        </Link>
        <Link
          href="/budgets"
          className="rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          Budgets
        </Link>
      </div>
    </div>
  );
}
