// src/pages/DashboardPage.jsx

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../auth/AuthContext.jsx';
import { ProtectedRoute } from '../auth/ProtectedRoute.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { getSessionStats } from '../api/audio_processing.js';
import { AppContext } from '../AppContext.jsx';

export const DashboardPage = () => {
    const { user, loadingAuth, accessToken, showMessage } = useContext(AuthContext);
    const { navigate } = useContext(AppContext);
    const [stats, setStats] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!accessToken) {
                setIsLoadingStats(false);
                return;
            }
            setIsLoadingStats(true);
            try {
                const response = await getSessionStats(accessToken);
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    const errorData = await response.json();
                    showMessage(`Failed to load dashboard stats: ${errorData.detail || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Network error fetching dashboard stats:', error);
                showMessage('Network error loading dashboard stats. Please try again.', 'error');
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [accessToken, showMessage]);

    if (loadingAuth) {
        return <LoadingSpinner />;
    }

    return (
        <ProtectedRoute>
            <div className="p-8 bg-white rounded-lg shadow-md w-full mx-auto max-w-4xl">
                <h2 className="text-3xl font-bold text-indigo-700 mb-4 text-center">
                    Welcome to your Dashboard, {user?.first_name || user?.username}!
                </h2>
                <p className="text-lg text-gray-600 mb-8 text-center">
                    Your personalized overview of your AI Voice Assistant activity.
                </p>

                {isLoadingStats ? (
                    <LoadingSpinner />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        {/* Stat Card: Total Sessions */}
                        <div className="bg-blue-50 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            <h3 className="text-2xl font-bold text-blue-800">{stats?.total_sessions ?? 0}</h3>
                            <p className="text-blue-700">Total Sessions</p>
                        </div>

                        {/* Stat Card: Completed Sessions */}
                        <div className="bg-green-50 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <h3 className="text-2xl font-bold text-green-800">{stats?.completed_sessions ?? 0}</h3>
                            <p className="text-green-700">Completed Analyses</p>
                        </div>

                        {/* Stat Card: In Progress/Failed Sessions */}
                        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm flex flex-col items-center text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <h3 className="text-2xl font-bold text-yellow-800">
                                {(stats?.pending_sessions ?? 0) + (stats?.transcribing_sessions ?? 0) + (stats?.analyzing_sessions ?? 0) + (stats?.failed_sessions ?? 0)}
                            </h3>
                            <p className="text-yellow-700">In Progress / Failed</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                ({stats?.pending_sessions ?? 0} Pending, {stats?.transcribing_sessions ?? 0} Transcribing, {stats?.analyzing_sessions ?? 0} Analyzing, {stats?.failed_sessions ?? 0} Failed)
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mb-10 text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                    <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                        <button
                            onClick={() => navigate('speech-to-text')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200 flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                            Start New Session
                        </button>
                        <button
                            onClick={() => navigate('voices')}
                            className="border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-200 flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            View All History
                        </button>
                    </div>
                </div>

                {/* Upcoming Features Section */}
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">What's Next?</h3>
                    <ul className="list-disc list-inside text-left mx-auto max-w-md text-gray-700 space-y-2">
                        <li>**More Processing Modes:** Meeting, Medical Notes, Thought Journal, Interview.</li>
                        <li>**Interactive Transcript:** Click to highlight, add comments/labels.</li>
                        <li>**Advanced Search & Filtering:** More powerful ways to find insights.</li>
                        <li>**Export Options:** Export to Google Docs, Notion.</li>
                        <li>**Team Collaboration:** Share sessions and insights with your team.</li>
                        <li>**AI Agent Expansion:** Scheduled audio sync, conversational memory.</li>
                    </ul>
                    <p className="mt-6 text-gray-600 text-center">We're continuously building to make your workflow unstoppable!</p>
                </div>
            </div>
        </ProtectedRoute>
    );
};