import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { Category, CategoryWithChildren } from '@/lib/types';

export function useCategories() {
  const { userId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
    setIsLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Organize categories into hierarchy
  const categoriesHierarchy = useCallback((): CategoryWithChildren[] => {
    const parentCategories = categories.filter((c) => !c.parent_id);
    return parentCategories.map((parent) => ({
      ...parent,
      children: categories.filter((c) => c.parent_id === parent.id),
    }));
  }, [categories]);

  // Get flat list of parent categories only
  const parentCategories = useCallback(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  // Get children of a specific parent
  const getChildren = useCallback(
    (parentId: string) => categories.filter((c) => c.parent_id === parentId),
    [categories]
  );

  return {
    categories,
    categoriesHierarchy: categoriesHierarchy(),
    parentCategories: parentCategories(),
    getChildren,
    isLoading,
    refetch: fetchCategories,
  };
}
