// src/AppContext.jsx

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { AuthContext } from './auth/AuthContext.jsx'; // Correctly imported AuthContext
import { getAllSessions, getSessionStatus } from './api/audio_processing.js'; // Import API functions

export const AppContext = createContext(null);

const POLLING_INTERVAL = 3000; // Define polling interval globally

// AppProvider now receives auth-related values as props
export const AppProvider = ({ children, accessToken, isAuthenticated, loadingAuth, showMessage }) => {
    const [currentPage, setCurrentPage] = useState('home');
    const [activeSessions, setActiveSessions] = useState([]); // Global active sessions state

    // Memoized navigate function
    const navigate = useCallback((page, params = {}) => {
        setCurrentPage({ page, params });
    }, []);

    // Optimized: Function to update active sessions globally
    // This function will intelligently add new sessions or update existing ones
    // without creating a completely new array instance if only one item changes.
    const updateActiveSessions = useCallback((newSessionData) => {
        setActiveSessions(prevSessions => {
            const existingIndex = prevSessions.findIndex(s => s.id === newSessionData.id);

            if (existingIndex > -1) {
                const updatedSession = { ...prevSessions[existingIndex], ...newSessionData };
                // Only create a new array if the session data actually changed
                // This deep comparison prevents unnecessary re-renders
                if (JSON.stringify(updatedSession) !== JSON.stringify(prevSessions[existingIndex])) {
                    const updatedSessionsArray = [...prevSessions];
                    updatedSessionsArray[existingIndex] = updatedSession;
                    return updatedSessionsArray;
                }
                return prevSessions; // No actual change, return previous array reference
            } else {
                // If session is new, add it to the beginning of a new array
                return [newSessionData, ...prevSessions];
            }
        });
    }, []); // No dependencies, so this function's identity is stable

    // Function to remove a session from active list (e.g., if it completes and we want to clean up)
    const removeActiveSession = useCallback((sessionId) => {
        setActiveSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    }, []);


    // --- Centralized Polling Effect ---
    useEffect(() => {
        let pollingIntervalId;

        const startPolling = async () => {
            if (!accessToken || !isAuthenticated || loadingAuth) {
                // Don't poll if not authenticated or still loading auth
                return;
            }

            // Fetch all sessions initially to populate the global state
            try {
                const response = await getAllSessions(accessToken);
                if (response.ok) {
                    const data = await response.json();
                    data.forEach(session => updateActiveSessions(session));
                } else {
                    console.error('Failed to initially fetch all sessions for polling:', await response.text());
                }
            } catch (error) {
                console.error('Network error during initial session fetch for polling:', error);
            }

            // Set up interval for ongoing polling of processing sessions
            pollingIntervalId = setInterval(async () => {
                // Filter for sessions that are currently in a processing state
                const sessionsToPoll = activeSessions.filter(s =>
                    s.status === 'PENDING' || s.status === 'TRANSCRIBING' || s.status === 'ANALYZING'
                );

                for (const session of sessionsToPoll) {
                    try {
                        const response = await getSessionStatus(session.id, accessToken);
                        if (response.ok) {
                            const data = await response.json();
                            updateActiveSessions(data); // Update global state with new status
                            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                                showMessage(`Session "${data.title || data.original_file_name}" ${data.status.toLowerCase()}!`, data.status === 'COMPLETED' ? 'success' : 'error');
                            }
                        } else {
                            console.error(`Failed to get status for session ${session.id}:`, await response.text());
                            // If status check fails, assume it might be stuck or failed
                            updateActiveSessions({ id: session.id, status: 'FAILED' }); // Mark as failed
                            showMessage(`Failed to get status for session "${session.title || session.original_file_name}". Marking as FAILED.`, 'error');
                        }
                    } catch (error) {
                        console.error(`Network error during polling for session ${session.id}:`, error);
                        updateActiveSessions({ id: session.id, status: 'FAILED' }); // Mark as failed
                        showMessage(`Network error during polling for session "${session.title || session.original_file_name}". Marking as FAILED.`, 'error');
                    }
                }
            }, POLLING_INTERVAL);
        };

        // Start polling when authenticated and not loading
        if (isAuthenticated && !loadingAuth) {
            startPolling();
        }

        // Cleanup: Clear interval when component unmounts or auth state changes
        return () => {
            if (pollingIntervalId) {
                clearInterval(pollingIntervalId);
            }
        };
    }, [accessToken, isAuthenticated, loadingAuth, updateActiveSessions, showMessage, activeSessions]); // activeSessions is a dependency to ensure polling loop has latest list

    const contextValue = {
        currentPage,
        navigate,
        activeSessions,
        updateActiveSessions,
        removeActiveSession
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};