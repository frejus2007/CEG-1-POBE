import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-200 ring-offset-2 focus:ring-2 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 focus:ring-2 focus:ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-green-200 ring-offset-2 focus:ring-2 focus:ring-green-500',
};

const Button = ({
    children,
    variant = 'primary',
    className = '',
    icon: Icon,
    isLoading = false,
    disabled,
    ...props
}) => {
    return (
        <motion.button
            whileHover={!isLoading && !disabled ? { scale: 1.02 } : {}}
            whileTap={!isLoading && !disabled ? { scale: 0.98 } : {}}
            disabled={isLoading || disabled}
            className={`
        inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium text-sm
        transition-colors duration-200 outline-none
        ${variants[variant]} 
        ${(isLoading || disabled) ? 'opacity-70 cursor-not-allowed transform-none' : ''}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : Icon ? (
                <Icon className="w-4 h-4 mr-2" />
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
