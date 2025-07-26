// src/pages/SpeechToTextPage.jsx

import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react'; // Added useMemo
import { AuthContext } from '../auth/AuthContext.jsx';
import { AppContext } from '../AppContext.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';
import { uploadSessionFile, getSessionStatus, getSessionResults, downloadNotesPdf, searchSession, askLlMAboutSession } from '../api/audio_processing.js';

export const SpeechToTextPage = ({ initialSessionId }) => {
    const { accessToken, showMessage, user } = useContext(AuthContext);
    const { activeSessions, updateActiveSessions } = useContext(AppContext);

    const [selectedFile, setSelectedFile] = useState(null);
    const [sessionTitle, setSessionTitle] = useState('');
    const [processingMode, setProcessingMode] = useState('LECTURE');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedSessionForView, setSelectedSessionForView] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    // --- Live Recording States ---
    const [isRecordingLive, setIsRecordingLive] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const micStreamRef = useRef(null);
    const displayStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const [recordedBlob, setRecordedBlob] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Q&A state
    const [qaQuestion, setQaQuestion] = useState('');
    const [qaAnswer, setQaAnswer] = useState('');
    const [isAskingQa, setIsAskingQa] = useState(false);
    const [qaContext, setQaContext] = useState('');

    // State for PDF download loading
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const POLLING_INTERVAL = 3000;

    const fetchAndDisplayResults = useCallback(async (sessionId) => {
        setIsLoadingResults(true);
        try {
            const response = await getSessionResults(sessionId, accessToken);
            if (response.ok) {
                const data = await response.json();
                setAnalysisResult(data.analysis_result);
                setSelectedSessionForView(data);
                setSearchResults(null);
                setQaAnswer('');
            } else {
                const errorData = await response.json();
                showMessage(`Failed to load results: ${errorData.detail || 'Unknown error'}`, 'error');
                setSelectedSessionForView(null);
            }
        } catch (error) {
            console.error('Network error fetching session results:', error);
            showMessage('Network error loading session results. Please try again.', 'error');
            setSelectedSessionForView(null);
        } finally {
            setIsLoadingResults(false);
        }
    }, [accessToken, showMessage]);

    useEffect(() => {
        if (initialSessionId && accessToken) {
            fetchAndDisplayResults(initialSessionId);
        }
    }, [initialSessionId, accessToken, fetchAndDisplayResults]);

    useEffect(() => {
        const intervals = {};

        const sessionsToPoll = activeSessions.filter(session =>
            session.status !== 'COMPLETED' && session.status !== 'FAILED'
        );

        sessionsToPoll.forEach(session => {
            intervals[session.id] = setInterval(async () => {
                try {
                    const response = await getSessionStatus(session.id, accessToken);
                    if (response.ok) {
                        const data = await response.json();
                        updateActiveSessions(data);

                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                            clearInterval(intervals[session.id]);
                            showMessage(`Session "${data.title || data.original_file_name}" ${data.status.toLowerCase()}!`, data.status === 'COMPLETED' ? 'success' : 'error');
                            if (selectedSessionForView && selectedSessionForView.id === data.id && data.status === 'COMPLETED') {
                                fetchAndDisplayResults(data.id);
                            }
                        }
                    } else {
                        console.error(`Failed to get status for session ${session.id}:`, await response.text());
                        clearInterval(intervals[session.id]);
                        updateActiveSessions({ id: session.id, status: 'FAILED' });
                        showMessage(`Failed to get status for session "${session.title || session.original_file_name}". Marking as FAILED.`, 'error');
                    }
                } catch (error) {
                    console.error(`Network error getting status for session ${session.id}:`, error);
                    clearInterval(intervals[session.id]);
                    updateActiveSessions({ id: session.id, status: 'FAILED' });
                    showMessage(`Network error for session "${session.title || session.original_file_name}". Marking as FAILED.`, 'error');
                }
            }, POLLING_INTERVAL);
        });

        return () => {
            Object.values(intervals).forEach(clearInterval);
        };
    }, [activeSessions, accessToken, showMessage, selectedSessionForView, fetchAndDisplayResults, initialSessionId, updateActiveSessions]);


    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setRecordedBlob(null);
        } else {
            setSelectedFile(null);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            setSelectedFile(event.dataTransfer.files[0]);
            setRecordedBlob(null);
        }
    };

    const handleUpload = async () => {
        let fileToUpload = selectedFile;
        if (recordedBlob) {
            fileToUpload = new File([recordedBlob], `live_recording_${Date.now()}.webm`, { type: 'audio/webm' });
        }

        if (!fileToUpload) {
            showMessage('Please select or record a file first.', 'error');
            return;
        }
        if (!accessToken) {
            showMessage('You must be logged in to upload files.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadSessionFile(fileToUpload, processingMode, sessionTitle || fileToUpload.name, accessToken);
            const data = await response.json();

            if (response.ok) {
                showMessage('File uploaded successfully! Processing started.', 'success');
                updateActiveSessions({
                    id: data.id,
                    title: data.title || data.original_file_name,
                    original_file_name: data.original_file_name,
                    status: data.status,
                    upload_timestamp: data.upload_timestamp,
                });
                setSelectedFile(null);
                setRecordedBlob(null);
                setSessionTitle('');
                setAnalysisResult(null);
                setSelectedSessionForView(null);
            } else {
                const errorMessage = data.detail || Object.values(data).flat().join(' ');
                showMessage(`Upload failed: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Network error during file upload:', error);
            showMessage('Network error during file upload. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleStartLiveRecording = async () => {
        try {
            showMessage('Please select a "Browser Tab" and check "Share tab audio" in the next prompt for best results.', 'info', 10000);

            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = micStream;

            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            displayStreamRef.current = displayStream;

            displayStream.getVideoTracks().forEach(track => track.stop());

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const micSource = audioContext.createMediaStreamSource(micStream);
            const displaySource = audioContext.createMediaStreamSource(displayStream);
            const destination = audioContext.createMediaStreamDestination();

            micSource.connect(destination);
            displaySource.connect(destination);

            const recorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                showMessage('Live recording stopped. Ready for upload!', 'success');
                micStreamRef.current?.getTracks().forEach(track => track.stop());
                displayStreamRef.current?.getTracks().forEach(track => track.stop());
                audioContextRef.current?.close();
            };

            recorder.start();
            setIsRecordingLive(true);
            setRecordedBlob(null);
            setSelectedFile(null);
            showMessage('Live recording started...', 'info');

        } catch (error) {
            console.error('Error starting live recording:', error);
            if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                showMessage("Microphone/Display not found. Please ensure devices are connected and permissions granted.", "error");
            } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                showMessage("Recording permission denied. Please allow microphone/screen sharing access.", "error");
            } else if (error.name === "AbortError") {
                showMessage("Recording initiation cancelled.", "info");
            } else {
                showMessage(`Failed to start live recording: ${error.message || error.name}`, 'error');
            }
            setIsRecordingLive(false);
            micStreamRef.current?.getTracks().forEach(track => track.stop());
            displayStreamRef.current?.getTracks().forEach(track => track.stop());
            audioContextRef.current?.close();
        }
    };

    const handleStopLiveRecording = () => {
        if (mediaRecorderRef.current && isRecordingLive) {
            mediaRecorderRef.current.stop();
            setIsRecordingLive(false);
        }
    };

    const handleViewResults = (session) => {
        if (session.status === 'COMPLETED') {
            fetchAndDisplayResults(session.id);
        } else {
            showMessage('Session must be completed to view results.', 'info');
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedSessionForView || !analysisResult || !analysisResult.notes_text) {
            showMessage('No notes available to download.', 'error');
            return;
        }
        setIsDownloadingPdf(true);
        try {
            const response = await downloadNotesPdf(selectedSessionForView.id, accessToken);
            if (response.ok) {
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'notes.pdf';
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="([^"]+)"/);
                    if (match && match[1]) {
                        filename = match[1];
                    }
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showMessage('Notes PDF downloaded successfully!', 'success');
            } else {
                const errorText = await response.text();
                showMessage(`Failed to download PDF: ${errorText || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Network error downloading PDF:', error);
            showMessage('Network error downloading PDF. Please try again.', 'error');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        if (!selectedSessionForView || !accessToken) {
            showMessage('Please select a session to search within.', 'error');
            return;
        }

        setIsSearching(true);
        try {
            const response = await searchSession(selectedSessionForView.id, searchQuery, accessToken);
            if (response.ok) {
                const data = await response.json();
                if (data.detail && data.detail === "No matches found.") {
                    showMessage('No matches found for your search.', 'info');
                    setSearchResults({});
                } else {
                    setSearchResults(data);
                    showMessage('Search completed!', 'success');
                }
            } else {
                const errorData = await response.json();
                showMessage(`Search failed: ${errorData.detail || 'Unknown error'}`, 'error');
                setSearchResults(null);
            }
        } catch (error) {
            console.error('Network error during search:', error);
            showMessage('Network error during search. Please try again.', 'error');
            setSearchResults(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAskQa = async () => {
        if (!qaQuestion.trim()) {
            setQaAnswer('');
            showMessage('Please enter a question.', 'error');
            return;
        }
        if (!selectedSessionForView || !accessToken) {
            showMessage('Please select a session to ask about.', 'error');
            return;
        }

        setIsAskingQa(true);
        setQaAnswer('');
        try {
            const response = await askLlMAboutSession(selectedSessionForView.id, qaQuestion, qaContext, accessToken);
            if (response.ok) {
                const data = await response.json();
                setQaAnswer(data.answer);
                showMessage('AI answered your question!', 'success');
            } else {
                const errorData = await response.json();
                showMessage(`AI query failed: ${errorData.detail || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Network error during Q&A:', error);
            showMessage('Network error during Q&A. Please try again.', 'error');
        } finally {
            setIsAskingQa(false);
        }
    };

    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            const selectedText = selection.toString();
            setQaContext(selectedText);
            showMessage(`Selected text will be used as context for Q&A.`, 'info');
        } else {
            setQaContext('');
        }
    };

    const highlightText = (text, term, highlightClass = 'bg-yellow-300') => {
        if (!term || !text) return text;
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === term.toLowerCase() ? (
                <span key={index} className={highlightClass}>
                    {part}
                </span>
            ) : (
                part
            )
        );
    };


    return (
        <div className="p-8 bg-white rounded-lg shadow-md w-full mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Speech to Text & Analysis</h2>
            <p className="text-lg text-gray-600 mb-6 text-center">
                Upload an audio/video file or record live to get transcriptions, summaries, notes, and detailed insights.
            </p>

            {!selectedSessionForView ? (
                <>
                    <div className="border-b pb-8 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Upload New Session</h3>
                        <div
                            className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center cursor-pointer hover:border-indigo-500 transition-colors duration-200"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="audio/*,video/*"
                                disabled={isRecordingLive}
                            />
                            {selectedFile ? (
                                <p className="text-indigo-700 text-xl font-semibold">Selected: {selectedFile.name}</p>
                            ) : (
                                <>
                                    <p className="text-gray-500 text-xl">Drag & Drop Audio/Video File Here</p>
                                    <p className="text-gray-400 text-sm mt-2">.mp3, .wav, .mp4, etc.</p>
                                    <button
                                        type="button"
                                        className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                                        disabled={isRecordingLive}
                                    >
                                        Or Browse Files
                                    </button>
                                </>
                            )}
                        </div>

                        {recordedBlob && (
                            <div className="mt-4 p-4 border rounded-lg bg-indigo-50 text-center">
                                <p className="text-indigo-800 font-semibold">Live Recording Ready!</p>
                                <audio controls src={URL.createObjectURL(recordedBlob)} className="mt-2 w-full"></audio>
                                <button
                                    onClick={() => setRecordedBlob(null)}
                                    className="mt-2 text-sm text-indigo-600 hover:underline"
                                >Clear Recording</button>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sessionTitle">
                                    Session Title (Optional)
                                </label>
                                <input
                                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    id="sessionTitle"
                                    type="text"
                                    placeholder="e.g., Physics Lecture - Chapter 5"
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                    disabled={isRecordingLive}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="processingMode">
                                    Processing Mode
                                </label>
                                <select
                                    className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    id="processingMode"
                                    value={processingMode}
                                    onChange={(e) => setProcessingMode(e.target.value)}
                                    disabled={isRecordingLive}
                                >
                                    <option value="LECTURE">Lecture Mode</option>
                                </select>
                            </div>

                            {!isRecordingLive ? (
                                <button
                                    onClick={handleStartLiveRecording}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full flex items-center justify-center"
                                    disabled={isUploading}
                                >
                                    Start Live Recording
                                </button>
                            ) : (
                                <button
                                    onClick={handleStopLiveRecording}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full flex items-center justify-center"
                                >
                                    <LoadingSpinner /> Recording... Click to Stop
                                </button>
                            )}

                            <button
                                onClick={handleUpload}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full flex items-center justify-center"
                                disabled={(!selectedFile && !recordedBlob) || isUploading || isRecordingLive}
                            >
                                {isUploading ? <LoadingSpinner /> : 'Process File / Upload Recording'}
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Your Recent Uploads</h3>
                        <div className="space-y-4">
                            {activeSessions.length === 0 ? (
                                <p className="text-gray-500 text-center">No recent uploads. Upload or record a file to get started!</p>
                            ) : (
                                activeSessions.map(session => (
                                    <div key={session.id} className={`bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center ${selectedSessionForView?.id === session.id ? 'border-2 border-indigo-500' : ''}`}>
                                        <div className="mb-2 sm:mb-0">
                                            <p className="font-semibold text-indigo-700">{session.title || session.original_file_name}</p>
                                            <p className="text-sm text-gray-600">Status: <span className={`font-medium ${
                                                session.status === 'COMPLETED' ? 'text-green-600' :
                                                session.status === 'FAILED' ? 'text-red-600' :
                                                'text-blue-600'
                                            }`}> {session.status.replace('_', ' ')}</span></p>
                                            <p className="text-xs text-gray-500">Uploaded: {new Date(session.upload_timestamp).toLocaleString()}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {session.status === 'COMPLETED' ? (
                                                <button
                                                    onClick={() => handleViewResults(session)}
                                                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg"
                                                >
                                                    View Results
                                                </button>
                                            ) : (
                                                <span className="text-blue-600 text-sm flex items-center">
                                                    <LoadingSpinner />
                                                    <span className="ml-2">
                                                        {session.status === 'PENDING' && 'Pending...'}
                                                        {session.status === 'TRANSCRIBING' && 'Transcribing...'}
                                                        {session.status === 'ANALYZING' && 'Analyzing...'}
                                                        {session.status === 'FAILED' && 'Failed'}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="mt-8 border-t pt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis Results for "{selectedSessionForView.title || selectedSessionForView.original_file_name}"</h3>
                    {isLoadingResults ? (
                        <LoadingSpinner />
                    ) : (
                        analysisResult && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleDownloadPdf}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                                        disabled={isDownloadingPdf}
                                    >
                                        {isDownloadingPdf ? <LoadingSpinner /> : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="17" x2="12" y2="10"></line><polyline points="9 14 12 17 15 14"></polyline></svg>
                                                Download Notes PDF
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="border p-4 rounded-lg bg-gray-50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Search Content</h4>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            className="flex-grow shadow appearance-none border rounded-l-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Search keywords..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-r-lg flex items-center"
                                            disabled={isSearching}
                                        >
                                            {isSearching ? <LoadingSpinner /> : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                            )}
                                        </button>
                                    </div>
                                    {searchResults && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            {Object.keys(searchResults).length === 0 && <p>No matches found.</p>}
                                            {searchResults.transcription_matches && <p className="text-green-700">&#10003; Found in Transcription</p>}
                                            {searchResults.summary_matches && <p className="text-green-700">&#10003; Found in Summary</p>}
                                            {searchResults.notes_matches && <p className="text-green-700">&#10003; Found in Notes</p>}
                                            {searchResults.suggestions_matches && <p className="text-green-700">&#10003; Found in Suggestions</p>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Transcription</h4>
                                    <div
                                        className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto text-gray-700"
                                        onMouseUp={handleTextSelection}
                                    >
                                        <pre className="whitespace-pre-wrap font-sans text-sm">{highlightText(analysisResult.transcription_text, searchQuery)}</pre>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Summary</h4>
                                    <div
                                        className="bg-gray-50 p-4 rounded-lg border max-h-48 overflow-y-auto text-gray-700"
                                        onMouseUp={handleTextSelection}
                                    >
                                        <pre className="whitespace-pre-wrap font-sans text-sm">{highlightText(analysisResult.summary_text, searchQuery)}</pre>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Notes</h4>
                                    <div
                                        className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto text-gray-700"
                                        onMouseUp={handleTextSelection}
                                    >
                                        <pre className="whitespace-pre-wrap font-sans text-sm">{highlightText(analysisResult.notes_text, searchQuery)}</pre>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Suggestions and Resources</h4>
                                    <div
                                        className="bg-gray-50 p-4 rounded-lg border max-h-48 overflow-y-auto text-gray-700"
                                        onMouseUp={handleTextSelection}
                                    >
                                        <pre className="whitespace-pre-wrap font-sans text-sm">{highlightText(analysisResult.suggestions_resources_text, searchQuery)}</pre>
                                    </div>
                                </div>

                                <div className="border p-4 rounded-lg bg-gray-50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Ask AI about this Session</h4>
                                    {qaContext && (
                                        <p className="text-sm text-gray-500 italic mb-2">Using selected text as context: "{qaContext.substring(0, Math.min(qaContext.length, 100))}..."</p>
                                    )}
                                    <div className="flex flex-col space-y-2">
                                        <textarea
                                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            rows="3"
                                            placeholder="Ask a question about the lecture content..."
                                            value={qaQuestion}
                                            onChange={(e) => setQaQuestion(e.target.value)}
                                        ></textarea>
                                        <button
                                            onClick={handleAskQa}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out flex items-center justify-center"
                                            disabled={isAskingQa}
                                        >
                                            {isAskingQa ? <LoadingSpinner /> : 'Ask AI'}
                                        </button>
                                    </div>
                                    {qaAnswer && (
                                        <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300 text-purple-800">
                                            <h5 className="font-semibold mb-1">AI Answer:</h5>
                                            <pre className="whitespace-pre-wrap font-sans text-sm">{qaAnswer}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    <button onClick={() => setSelectedSessionForView(null)} className="mt-8 text-indigo-600 hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back to Upload/Active Sessions
                    </button>
                </div>
            )}
        </div>
    );
};