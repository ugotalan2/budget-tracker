import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Budget Tracker
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Track your expenses, manage budgets, and achieve your financial goals
        </p>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Track Expenses
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Easily add and categorize your daily expenses
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Set Budgets
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create monthly budgets and track your spending
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              View Insights
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Analyze your spending with charts and reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
