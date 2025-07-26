// src/api/audio_processing.js

const API_BASE_URL = 'http://127.0.0.1:8000/api/'; // Base URL for your Django backend API

export const uploadSessionFile = async (file, mode, title, accessToken) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processing_mode', mode);
    formData.append('title', title);

    const response = await fetch(`${API_BASE_URL}sessions/upload/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
    });
    return response;
};

export const getSessionStatus = async (sessionId, accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/status/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};

export const getSessionResults = async (sessionId, accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/results/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};

export const downloadNotesPdf = async (sessionId, accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/pdf/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    return response;
};

export const searchSession = async (sessionId, query, accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/search/?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};

export const askLlMAboutSession = async (sessionId, question, context = '', accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/qna/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, context }),
    });
    return response;
};

export const getAllSessions = async (accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};

export const getSessionStats = async (accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/stats/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};


export const retrySession = async (sessionId, accessToken) => {
    const response = await fetch(`${API_BASE_URL}sessions/${sessionId}/retry/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    return response;
};