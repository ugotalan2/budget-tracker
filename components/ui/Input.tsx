'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string; // for the $ sign on budget limit
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, id, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className={`${label ? 'mt-1' : ''} ${prefix ? 'relative' : ''}`}>
          {prefix && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`
              block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900
              placeholder-gray-400
              focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
              disabled:cursor-not-allowed disabled:opacity-50
              dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
              ${props.type === 'date' || props.type === 'month' ? 'dark:[color-scheme:dark]' : ''}
              ${prefix ? 'pl-7' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
