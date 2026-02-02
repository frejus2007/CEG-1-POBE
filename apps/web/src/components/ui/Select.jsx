import React from 'react';

const Select = ({ className = '', children, ...props }) => {
    return (
        <select
            className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

export default Select;
