import {
  flattenCategories,
  findCategoryById,
  getParentCategories,
  getAllChildCategories,
  findParentCategory,
  getChildrenOfParent,
  isParentCategory,
  isChildCategory,
  createCategoryMap,
  sortCategoriesByOrder,
  updateSortOrders,
} from '../categoryHelpers';

describe('categoryHelpers', () => {
  const mockCategories = [
    {
      id: 'parent-1',
      name: 'Housing',
      parent_id: null,
      color: '#3B82F6',
      sort_order: 1,
      children: [
        {
          id: 'child-1',
          name: 'Rent',
          parent_id: 'parent-1',
          color: '#3B82F6',
          sort_order: 1,
        },
        {
          id: 'child-2',
          name: 'Utilities',
          parent_id: 'parent-1',
          color: '#3B82F6',
          sort_order: 2,
        },
      ],
    },
    {
      id: 'parent-2',
      name: 'Food',
      parent_id: null,
      color: '#10B981',
      sort_order: 2,
      children: [
        {
          id: 'child-3',
          name: 'Groceries',
          parent_id: 'parent-2',
          color: '#10B981',
          sort_order: 1,
        },
      ],
    },
  ];

  describe('flattenCategories', () => {
    it('should flatten hierarchy to single array', () => {
      const flattened = flattenCategories(mockCategories);
      expect(flattened).toHaveLength(5); // 2 parents + 3 children
    });

    it('should include all parent and child categories', () => {
      const flattened = flattenCategories(mockCategories);
      const ids = flattened.map((c) => c.id);
      expect(ids).toContain('parent-1');
      expect(ids).toContain('child-1');
      expect(ids).toContain('child-2');
      expect(ids).toContain('parent-2');
      expect(ids).toContain('child-3');
    });
  });

  describe('findCategoryById', () => {
    it('should find category by id', () => {
      const flattened = flattenCategories(mockCategories);
      const found = findCategoryById(flattened, 'child-2');

      expect(found).toBeDefined();
      expect(found?.name).toBe('Utilities');
    });

    it('should return undefined for non-existent id', () => {
      const flattened = flattenCategories(mockCategories);
      const found = findCategoryById(flattened, 'non-existent');

      expect(found).toBeUndefined();
    });
  });

  describe('getParentCategories', () => {
    it('should return only parent categories', () => {
      const parents = getParentCategories(mockCategories);

      expect(parents).toHaveLength(2);
      expect(parents.map((p) => p.name)).toEqual(['Housing', 'Food']);
    });

    it('should return categories with null parent_id', () => {
      const parents = getParentCategories(mockCategories);

      parents.forEach((parent) => {
        expect(parent.parent_id).toBeNull();
      });
    });
  });

  describe('getAllChildCategories', () => {
    it('should return all child categories', () => {
      const children = getAllChildCategories(mockCategories);

      expect(children).toHaveLength(3);
      expect(children.map((c) => c.name)).toEqual([
        'Rent',
        'Utilities',
        'Groceries',
      ]);
    });
  });

  describe('findParentCategory', () => {
    it('should find parent of a child category', () => {
      const parent = findParentCategory(mockCategories, 'child-1');

      expect(parent).toBeDefined();
      expect(parent?.name).toBe('Housing');
      expect(parent?.id).toBe('parent-1');
    });

    it('should return undefined for parent category', () => {
      const parent = findParentCategory(mockCategories, 'parent-1');

      expect(parent).toBeUndefined();
    });

    it('should return undefined for non-existent category', () => {
      const parent = findParentCategory(mockCategories, 'non-existent');

      expect(parent).toBeUndefined();
    });
  });

  describe('getChildrenOfParent', () => {
    it('should get all children of a parent', () => {
      const children = getChildrenOfParent(mockCategories, 'parent-1');

      expect(children).toHaveLength(2);
      expect(children.map((c) => c.name)).toEqual(['Rent', 'Utilities']);
    });

    it('should return empty array for parent with no children', () => {
      const mockWithNoChildren = [
        {
          id: 'parent-3',
          name: 'Empty',
          parent_id: null,
          color: '#000',
          sort_order: 1,
        },
      ];

      const children = getChildrenOfParent(mockWithNoChildren, 'parent-3');

      expect(children).toEqual([]);
    });
  });

  describe('isParentCategory', () => {
    it('should identify parent categories', () => {
      const parent = {
        id: 'p1',
        name: 'Parent',
        parent_id: null,
        color: '#000',
        sort_order: 1,
      };
      expect(isParentCategory(parent)).toBe(true);
    });

    it('should identify child categories', () => {
      const child = {
        id: 'c1',
        name: 'Child',
        parent_id: 'p1',
        color: '#000',
        sort_order: 1,
      };
      expect(isParentCategory(child)).toBe(false);
    });
  });

  describe('isChildCategory', () => {
    it('should identify child categories', () => {
      const child = {
        id: 'c1',
        name: 'Child',
        parent_id: 'p1',
        color: '#000',
        sort_order: 1,
      };
      expect(isChildCategory(child)).toBe(true);
    });

    it('should identify parent categories', () => {
      const parent = {
        id: 'p1',
        name: 'Parent',
        parent_id: null,
        color: '#000',
        sort_order: 1,
      };
      expect(isChildCategory(parent)).toBe(false);
    });
  });

  describe('createCategoryMap', () => {
    it('should create lookup map for all categories', () => {
      const map = createCategoryMap(mockCategories);

      expect(map.size).toBe(5);
      expect(map.get('child-2')?.name).toBe('Utilities');
      expect(map.get('parent-1')?.color).toBe('#3B82F6');
    });

    it('should include parent name for children', () => {
      const map = createCategoryMap(mockCategories);

      expect(map.get('child-1')?.parent).toBe('Housing');
      expect(map.get('parent-1')?.parent).toBeUndefined();
    });
  });

  describe('sortCategoriesByOrder', () => {
    it('should sort categories by sort_order', () => {
      const unsorted = [
        { id: '3', name: 'C', sort_order: 3 },
        { id: '1', name: 'A', sort_order: 1 },
        { id: '2', name: 'B', sort_order: 2 },
      ];

      const sorted = sortCategoriesByOrder(unsorted);

      expect(sorted.map((c) => c.name)).toEqual(['A', 'B', 'C']);
    });

    it('should not mutate original array', () => {
      const original = [
        { id: '2', name: 'B', sort_order: 2 },
        { id: '1', name: 'A', sort_order: 1 },
      ];

      sortCategoriesByOrder(original);

      expect(original[0].name).toBe('B'); // Original unchanged
    });
  });

  describe('updateSortOrders', () => {
    it('should update sort orders sequentially', () => {
      const categories = [
        { id: '3', sort_order: 5 },
        { id: '1', sort_order: 10 },
        { id: '2', sort_order: 3 },
      ];

      const updated = updateSortOrders(categories);

      expect(updated.map((c) => c.sort_order)).toEqual([1, 2, 3]);
    });

    it('should maintain order of input array', () => {
      const categories = [
        { id: 'c', sort_order: 99 },
        { id: 'a', sort_order: 1 },
        { id: 'b', sort_order: 50 },
      ];

      const updated = updateSortOrders(categories);

      expect(updated.map((c) => c.id)).toEqual(['c', 'a', 'b']);
      expect(updated.map((c) => c.sort_order)).toEqual([1, 2, 3]);
    });
  });
});
