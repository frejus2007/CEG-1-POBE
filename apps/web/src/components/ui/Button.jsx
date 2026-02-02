import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-200 ring-offset-2 focus:ring-2 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 focus:ring-2 focus:ring-red-200',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
};

const Button = ({
    children,
    variant = 'primary',
    className = '',
    icon: Icon,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
        inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium text-sm
        transition-colors duration-200 outline-none
        ${variants[variant]} 
        ${className}
      `}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </motion.button>
    );
};

export default Button;
