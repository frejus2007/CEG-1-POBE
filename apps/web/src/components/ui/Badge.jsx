import React from 'react';

const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-50 text-blue-700 border border-blue-100',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-100',
    success: 'bg-green-50 text-green-700 border border-green-100',
    warning: 'bg-orange-50 text-orange-700 border border-orange-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
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
