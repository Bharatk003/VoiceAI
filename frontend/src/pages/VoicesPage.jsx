// src/pages/VoicesPage.jsx

import React, { useState, useEffect, useContext, memo } from 'react';
import { AuthContext } from '../auth/AuthContext.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { getAllSessions, retrySession } from '../api/audio_processing.js';
import { AppContext } from '../AppContext.jsx';

// Define a staleness threshold (e.g., 5 minutes in milliseconds)
const STALENESS_THRESHOLD_MS = 2 * 60 * 1000; // 5 minutes

// --- Memoized Session Card Component ---
const SessionCard = memo(({ session, handleViewAnalysis, handleRetrySession, isRetryingApiCallId }) => {
    const isProcessing = session.status === 'PENDING' || session.status === 'TRANSCRIBING' || session.status === 'ANALYZING';
    const isFailed = session.status === 'FAILED';
    const isCompleted = session.status === 'COMPLETED';

    // Calculate if the session is stale
    const isStale = isProcessing &&
                    (new Date() - new Date(session.upload_timestamp) > STALENESS_THRESHOLD_MS);

    // Determine if the retry button should be visible
    const showRetryButton = isFailed || isStale;
    // Determine if the processing indicator should be visible
    const showProcessingIndicator = isProcessing && !isStale;


    return (
        <div
            className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between"
        >
            <div>
                <h3 className="text-xl font-semibold text-indigo-700 mb-2 truncate" title={session.title || session.original_file_name}>
                    {session.title || session.original_file_name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Type:</span> {session.file_type}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Mode:</span> {session.processing_mode.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Status:</span>
                    <span className={`font-medium ${
                        isCompleted ? 'text-green-600' :
                        isFailed ? 'text-red-600' :
                        'text-blue-600'
                    }`}> {session.status.replace('_', ' ')}</span>
                </p>
                <p className="text-xs text-gray-500">
                    Uploaded: {new Date(session.upload_timestamp).toLocaleDateString()}
                </p>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
                {isCompleted ? (
                    <button
                        onClick={() => handleViewAnalysis(session.id)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg"
                    >
                        View Analysis
                    </button>
                ) : (
                    // Display Retry button if failed or stale, else display Processing indicator
                    showRetryButton ? (
                        <button
                            onClick={() => handleRetrySession(session.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center"
                            disabled={isRetryingApiCallId === session.id} // Disable only if its own retry API call is active
                        >
                            {isRetryingApiCallId === session.id ? (
                                <>
                                    <LoadingSpinner />
                                    <span className="ml-2">Retrying...</span>
                                </>
                            ) : (
                                'Retry'
                            )}
                        </button>
                    ) : (
                        // Display Processing indicator if not completed, not failed, and not stale
                        showProcessingIndicator && (
                            <span className="text-blue-600 text-sm flex items-center">
                                <LoadingSpinner />
                                <span className="ml-2">Processing...</span>
                            </span>
                        )
                    )
                )}
            </div>
        </div>
    );
});


export const VoicesPage = ({ navigate }) => {
    const { accessToken, showMessage, user, loadingAuth } = useContext(AuthContext);
    const { activeSessions, updateActiveSessions } = useContext(AppContext);

    const [isLoadingInitialFetch, setIsLoadingInitialFetch] = useState(true);
    const [isRetryingApiCallId, setIsRetryingApiCallId] = useState(null);

    const fetchAllSessionsAndUpdateGlobal = React.useCallback(async () => {
        if (!accessToken) {
            showMessage('You must be logged in to view history.', 'error');
            setIsLoadingInitialFetch(false);
            return;
        }
        setIsLoadingInitialFetch(true);
        try {
            const response = await getAllSessions(accessToken);
            if (response.ok) {
                const data = await response.json();
                data.forEach(session => updateActiveSessions(session));
            } else {
                const errorData = await response.json();
                showMessage(`Failed to load sessions: ${errorData.detail || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Network error fetching sessions:', error);
            showMessage('Network error loading sessions. Please try again.', 'error');
        } finally {
            setIsLoadingInitialFetch(false);
        }
    }, [accessToken, showMessage, updateActiveSessions]);


    useEffect(() => {
        if (accessToken && !loadingAuth) {
            fetchAllSessionsAndUpdateGlobal();
        } else if (!accessToken && !loadingAuth) {
            setIsLoadingInitialFetch(false);
        }
    }, [accessToken, loadingAuth, fetchAllSessionsAndUpdateGlobal]);


    const handleViewAnalysis = React.useCallback((sessionId) => {
        navigate('speech-to-text', { sessionId: sessionId });
    }, [navigate]);


    const handleRetrySession = React.useCallback(async (sessionToRetryId) => {
        setIsRetryingApiCallId(sessionToRetryId);
        try {
            const response = await retrySession(sessionToRetryId, accessToken);
            if (response.ok) {
                showMessage('Session re-enqueued for processing!', 'success');
                updateActiveSessions({ id: sessionToRetryId, status: 'PENDING' });
            } else {
                const errorData = await response.json();
                showMessage(`Failed to retry session: ${errorData.detail || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Network error retrying session:', error);
            showMessage('Network error retrying session. Please try again.', 'error');
        } finally {
            setIsRetryingApiCallId(null);
        }
    }, [accessToken, showMessage, updateActiveSessions]);


    const sessionsToDisplay = React.useMemo(() => {
        if (!user?.username) {
            return [];
        }
        const filteredSessions = activeSessions.filter(session => session.user === user.username);
        const sortedSessions = [...filteredSessions].sort((a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp));
        return sortedSessions;
    }, [activeSessions, user?.username]);


    if (isLoadingInitialFetch || loadingAuth) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-8 bg-white rounded-lg shadow-md w-full mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Your Voices History</h2>
            <p className="text-lg text-gray-600 mb-6 text-center">
                Browse your past audio and video analysis sessions.
            </p>

            {sessionsToDisplay.length === 0 ? (
                <div className="mt-8 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                    <p className="text-gray-500 text-xl">No sessions found.</p>
                    <p className="text-gray-400 text-sm mt-2">Upload a file on the "Speech to Text" page to start your history!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessionsToDisplay.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            handleViewAnalysis={handleViewAnalysis}
                            handleRetrySession={handleRetrySession}
                            isRetryingApiCallId={isRetryingApiCallId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};