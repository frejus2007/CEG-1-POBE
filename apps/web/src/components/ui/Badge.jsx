import React from 'react';

const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    success: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50',
    warning: 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50',
    danger: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50',
};

const Badge = ({ children, variant = 'default', className = '' }) => {
    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]}
      ${className}
    `}>
            {children}
        </span>
    );
};

export default Badge;
