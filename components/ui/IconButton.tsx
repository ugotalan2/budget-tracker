'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: 'default' | 'danger';
}

const variantStyles = {
  default:
    'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-900/30 dark:hover:text-gray-400',
  danger:
    'text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'default', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          rounded-md border border-gray-300 transition-colors
          dark:border-gray-600
          h-12 w-12 flex items-center justify-center
          md:h-9 md:w-9 md:p-1.5
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
