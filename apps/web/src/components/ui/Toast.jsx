import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, Loader } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
    const { id, message, type } = toast;

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => {
            const element = document.getElementById(`toast-${id}`);
            if (element) {
                element.classList.add('toast-enter');
            }
        }, 10);
        return () => clearTimeout(timer);
    }, [id]);

    const handleClose = () => {
        const element = document.getElementById(`toast-${id}`);
        if (element) {
            element.classList.add('toast-exit');
            setTimeout(() => onClose(id), 300);
        }
    };

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-500',
            textColor: 'text-white'
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-500',
            textColor: 'text-white'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-500',
            textColor: 'text-white'
        },
        loading: {
            icon: Loader,
            bgColor: 'bg-gray-700',
            textColor: 'text-white'
        }
    };

    const { icon: Icon, bgColor, textColor } = config[type] || config.info;

    return (
        <div
            id={`toast-${id}`}
            className={`toast flex items-center gap-3 ${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`} />
            <span className="flex-1 text-sm font-medium">{message}</span>
            {type !== 'loading' && (
                <button
                    onClick={handleClose}
                    className="ml-2 hover:opacity-80 transition-opacity"
                    aria-label="Fermer"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={removeToast} />
            ))}
        </div>
    );
};

export default Toast;
