'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { type UserPreferences } from '@/lib/types';

export default function SettingsPage() {
  const { userId } = useAuth();
  const supabase = createClient();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchPreferences = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) {
      console.error('Error fetching preferences:', error);
    }

    if (data) {
      setPreferences(data);
    } else {
      // Create default preferences
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          auto_adjust_parent_budgets: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
      } else if (newPrefs) {
        setPreferences(newPrefs);
      }
    }

    setIsLoading(false);
  };

  const handleToggle = async (
    setting: keyof UserPreferences,
    value: boolean
  ) => {
    if (!userId || !preferences) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('user_preferences')
      .update({ [setting]: value, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      alert('Failed to update settings: ' + error.message);
    } else {
      setPreferences({ ...preferences, [setting]: value });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your preferences and app behavior
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Budget Settings
          </h2>

          <div className="space-y-4">
            {/* Auto-adjust parent budgets */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label
                  htmlFor="auto-adjust"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Auto-adjust parent budgets
                </label>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Automatically increase parent budgets when child budgets would
                  exceed the parent. Also decrease parent budgets when all
                  children are lowered (only if parent equals sum of children).
                </p>
              </div>
              <button
                id="auto-adjust"
                type="button"
                disabled={isSaving}
                onClick={() =>
                  handleToggle(
                    'auto_adjust_parent_budgets',
                    !preferences?.auto_adjust_parent_budgets
                  )
                }
                className={`relative ml-4 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  preferences?.auto_adjust_parent_budgets
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    preferences?.auto_adjust_parent_budgets
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
