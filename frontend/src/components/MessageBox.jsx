import React from 'react';

export const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg border ${bgColor} z-50`} role="alert">
            <div className="flex items-center">
                <p className={`font-bold ${textColor}`}>{message}</p>
                <button onClick={onClose} className="ml-4 text-lg font-bold text-gray-600 hover:text-gray-800 focus:outline-none">
                    &times;
                </button>
            </div>
        </div>
    );
};
