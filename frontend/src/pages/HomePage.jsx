import React, { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext.jsx';

export const HomePage = () => {
    const { user, isAuthenticated } = useContext(AuthContext);
    return (
        <div className="p-8 text-center bg-white rounded-lg shadow-md">
            <h1 className="text-4xl font-extrabold text-indigo-600 mb-4">Welcome to AI Voice Assistant!</h1>
            <p className="text-xl text-gray-700 mb-6">
                {isAuthenticated ? `Hello, ${user?.first_name || user?.username}! Ready to analyze your conversations?` : 'Your smart co-pilot for audio conversations.'}
            </p>
            <p className="text-lg text-gray-600">
                Transcribe, summarize, and get insights from any audio, in any field.
            </p>
        </div>
    );
};
