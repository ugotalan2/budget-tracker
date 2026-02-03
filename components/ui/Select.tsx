'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  SelectHTMLAttributes,
} from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'options'
> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

// Remove forwardRef - we don't need it for this custom component
export default function Select({
  label,
  options,
  error,
  hint,
  id,
  value,
  onChange,
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  const OPTION_HEIGHT = 36;
  const VISIBLE_COUNT_LG = 8;
  const VISIBLE_COUNT_SM = 5;
  const GAP = 4;

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  // Outside click handler - change from 'mousedown' to 'click' and add a small delay
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node) // Add this check
      ) {
        return;
      }
      closeDropdown();
    };

    // Use 'click' instead of 'mousedown' so li onClick fires first
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDropdown();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDropdown]);

  // Scroll selected into center when open
  useEffect(() => {
    if (isOpen && listRef.current && selectedIndex >= 0) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [isOpen, selectedIndex]);

  const handleOpen = () => {
    if (disabled) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isLargeScreen = viewportHeight > 700;
    const visibleCount = isLargeScreen ? VISIBLE_COUNT_LG : VISIBLE_COUNT_SM;
    const maxHeight = visibleCount * OPTION_HEIGHT;

    const spaceBelow = viewportHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    // Open upward if not enough space below and more space above
    const top =
      spaceBelow >= maxHeight
        ? rect.bottom + GAP
        : spaceAbove >= maxHeight
          ? rect.top - maxHeight - GAP
          : // Not enough room either way – use whichever is bigger
            spaceBelow >= spaceAbove
            ? rect.bottom + GAP
            : rect.top - maxHeight - GAP;

    setPosition({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight:
        spaceBelow >= maxHeight || spaceAbove < spaceBelow
          ? Math.min(maxHeight, spaceBelow)
          : Math.min(maxHeight, spaceAbove),
    });
    setIsOpen(true);
  };

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      // Create a synthetic event
      const syntheticEvent = {
        target: {
          value: optionValue,
          name: id,
        },
        currentTarget: {
          value: optionValue,
          name: id,
        },
      } as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }

    closeDropdown();
  };

  return (
    <>
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            handleOpen();
          }}
          disabled={disabled}
          className={`
            ${label ? 'mt-1' : ''}
            flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300
            ${className}
          `}
        >
          <span>{selectedOption?.label ?? 'Select...'}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform dark:text-gray-500 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {hint && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Portal: renders into document.body, completely outside the page layout */}
      {isOpen &&
        position &&
        ReactDOM.createPortal(
          <div
            className="fixed z-50 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            <ul
              ref={listRef}
              className="overflow-y-auto py-1"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    handleSelect(opt.value);
                  }}
                  className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.label}</span>
                    {opt.value === value && (
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
