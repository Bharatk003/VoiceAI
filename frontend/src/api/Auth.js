const API_BASE_URL = 'http://127.0.0.1:8000/api/auth/'; // IMPORTANT: Replace with your actual backend URL

export const verifyToken = async (token) => {
    const response = await fetch(`${API_BASE_URL}token/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return response;
};

export const fetchProfile = async (token) => {
    const response = await fetch(`${API_BASE_URL}profile/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    return response;
};

export const refreshTokenApi = async (refreshToken) => {
    const response = await fetch(`${API_BASE_URL}token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
    });
    return response;
};

export const loginApi = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return response;
};

export const registerApi = async (userData) => {
    const response = await fetch(`${API_BASE_URL}register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return response;
};

export const logoutApi = async (refreshToken, accessToken) => {
    const response = await fetch(`${API_BASE_URL}logout/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}` // Optional, but good practice
        },
        body: JSON.stringify({ refresh_token: refreshToken })
    });
    return response;
};

export const updateProfileApi = async (profileData, accessToken) => {
    const response = await fetch(`${API_BASE_URL}profile/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(profileData)
    });
    return response;
};
