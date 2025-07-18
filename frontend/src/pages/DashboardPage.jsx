import React, { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext.jsx';
import { ProtectedRoute } from '../Auth/ProtectedRoute.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';

export const DashboardPage = () => {
    const { user, loadingAuth } = useContext(AuthContext);

    if (loadingAuth) {
        return <LoadingSpinner />;
    }

    return (
        <ProtectedRoute>
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-indigo-700 mb-4">Welcome to your Dashboard, {user?.first_name || user?.username}!</h2>
                <p className="text-lg text-gray-600 mb-6">
                    This is a protected area. Here you will find your audio recordings, summaries, and insights.
                </p>
                <div className="mt-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Features:</h3>
                    <ul className="list-disc list-inside text-left mx-auto max-w-md text-gray-700 space-y-2">
                        <li>Audio Upload / Live Recording</li>
                        <li>Transcription & AI Summarization</li>
                        <li>Use-Case Modes (Lecture, Meeting, Medical, etc.)</li>
                        <li>Smart Q&A over Transcripts</li>
                        <li>Personalized Tags & Highlights</li>
                        <li>History & Search for all sessions</li>
                        <li>Voice Journal / Thought Capture Mode</li>
                    </ul>
                    <p className="mt-6 text-gray-600">Stay tuned for more powerful features!</p>
                </div>
            </div>
        </ProtectedRoute>
    );
};