'use client';

interface EditDeleteButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function EditDeleteButtons({
  onEdit,
  onDelete,
}: EditDeleteButtonsProps) {
  return (
    <div className="mt-3 flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
      <button
        onClick={onEdit}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      >
        Delete
      </button>
    </div>
  );
}
