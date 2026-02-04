import { Category } from './types';

type CategoryWithChildren = Category & {
  children?: Category[];
};

/**
 * Flatten hierarchical categories into a single array
 */
export function flattenCategories(
  categories: CategoryWithChildren[]
): Category[] {
  return categories.flatMap((parent) => [parent, ...(parent.children || [])]);
}

/**
 * Find a category by ID in a flattened list
 */
export function findCategoryById(
  categories: Category[],
  categoryId: string
): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

/**
 * Get all parent categories (categories with no parent_id)
 */
export function getParentCategories(
  categories: CategoryWithChildren[]
): CategoryWithChildren[] {
  return categories.filter((c) => !c.parent_id);
}

/**
 * Get all child categories from a hierarchical structure
 */
export function getAllChildCategories(
  categories: CategoryWithChildren[]
): Category[] {
  return categories.flatMap((parent) => parent.children || []);
}

/**
 * Find the parent category of a child category
 */
export function findParentCategory(
  categories: CategoryWithChildren[],
  childCategoryId: string
): CategoryWithChildren | undefined {
  const allFlat = flattenCategories(categories);
  const child = allFlat.find((c) => c.id === childCategoryId);

  if (!child?.parent_id) return undefined;

  return categories.find((p) => p.id === child.parent_id);
}

/**
 * Get all children of a specific parent category
 */
export function getChildrenOfParent(
  categories: CategoryWithChildren[],
  parentId: string
): Category[] {
  const parent = categories.find((p) => p.id === parentId);
  return parent?.children || [];
}

/**
 * Check if a category is a parent category
 */
export function isParentCategory(category: Category): boolean {
  return category.parent_id === null;
}

/**
 * Check if a category is a child category
 */
export function isChildCategory(category: Category): boolean {
  return category.parent_id !== null;
}

/**
 * Create a lookup map for fast category access by ID
 */
export function createCategoryMap(
  categories: CategoryWithChildren[]
): Map<string, { name: string; color: string; parent?: string }> {
  const map = new Map<
    string,
    { name: string; color: string; parent?: string }
  >();

  categories.forEach((parent) => {
    map.set(parent.id, { name: parent.name, color: parent.color });

    parent.children?.forEach((child) => {
      map.set(child.id, {
        name: child.name,
        color: child.color,
        parent: parent.name,
      });
    });
  });

  return map;
}

/**
 * Sort categories by sort_order
 */
export function sortCategoriesByOrder<T extends { sort_order: number }>(
  categories: T[]
): T[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Update sort orders after reordering
 */
export function updateSortOrders<T extends { sort_order: number }>(
  categories: T[]
): T[] {
  return categories.map((cat, index) => ({
    ...cat,
    sort_order: index + 1,
  }));
}
