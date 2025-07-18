import React, { useState, useEffect, createContext } from 'react';
import {
    verifyToken,
    fetchProfile,
    refreshTokenApi,
    loginApi,
    registerApi,
    logoutApi,
    updateProfileApi
} 

from '../api/Auth.js'; // Import API functions
import { MessageBox } from '../components/MessageBox.jsx'; // Import MessageBox

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000); // Message disappears after 5 seconds
    };

    useEffect(() => {
        const checkAuthStatus = async () => {
            if (accessToken) {
                try {
                    const response = await verifyToken(accessToken);

                    if (response.ok) {
                        await fetchUserProfile(accessToken);
                        setIsAuthenticated(true);
                    } else if (refreshToken) {
                        await refreshAccessToken();
                    } else {
                        clearAuth();
                    }
                } catch (error) {
                    console.error('Error checking auth status:', error);
                    clearAuth();
                }
            }
            setLoadingAuth(false);
        };

        checkAuthStatus();
    }, []);

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetchProfile(token);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setIsAuthenticated(true);
            } else {
                console.error('Failed to fetch user profile:', await response.text());
                clearAuth();
            }
        } catch (error) {
            console.error('Network error fetching user profile:', error);
            clearAuth();
        }
    };

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            clearAuth();
            return false;
        }
        try {
            const response = await refreshTokenApi(refreshToken);

            if (response.ok) {
                const data = await response.json();
                setAccessToken(data.access);
                localStorage.setItem('accessToken', data.access);
                if (data.refresh) {
                    setRefreshToken(data.refresh);
                    localStorage.setItem('refreshToken', data.refresh);
                }
                await fetchUserProfile(data.access);
                setIsAuthenticated(true);
                return true;
            } else {
                console.error('Failed to refresh token:', await response.text());
                clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Network error refreshing token:', error);
            clearAuth();
            return false;
        }
    };

    const clearAuth = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const login = async (username, password) => {
        setLoadingAuth(true);
        try {
            const response = await loginApi(username, password);
            const data = await response.json();

            if (response.ok) {
                setAccessToken(data.access);
                setRefreshToken(data.refresh);
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                await fetchUserProfile(data.access);
                setIsAuthenticated(true);
                showMessage('Login successful!', 'success');
                return true;
            } else {
                showMessage(data.detail || 'Login failed. Please check your credentials.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error during login:', error);
            showMessage('Network error during login. Please try again.', 'error');
            return false;
        } finally {
            setLoadingAuth(false);
        }
    };

    const register = async (userData) => {
        setLoadingAuth(true);
        try {
            const response = await registerApi(userData);
            const data = await response.json();

            if (response.ok) {
                setAccessToken(data.access);
                setRefreshToken(data.refresh);
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                await fetchUserProfile(data.access);
                setIsAuthenticated(true);
                showMessage('Registration successful! You are now logged in.', 'success');
                return true;
            } else {
                const errorMessage = data.detail || Object.values(data).flat().join(' ');
                showMessage(`Registration failed: ${errorMessage}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error during registration:', error);
            showMessage('Network error during registration. Please try again.', 'error');
            return false;
        } finally {
            setLoadingAuth(false);
        }
    };

    const logout = async () => {
        setLoadingAuth(true);
        try {
            const response = await logoutApi(refreshToken, accessToken);

            if (response.status === 205) {
                showMessage('Logged out successfully.', 'success');
            } else {
                const errorData = await response.json();
                showMessage(`Logout failed: ${errorData.detail || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Network error during logout:', error);
            showMessage('Network error during logout. Please try again.', 'error');
        } finally {
            clearAuth();
            setLoadingAuth(false);
        }
    };

    const updateProfile = async (profileData) => {
        setLoadingAuth(true);
        try {
            const response = await updateProfileApi(profileData, accessToken);
            const data = await response.json();

            if (response.ok) {
                setUser(data);
                showMessage('Profile updated successfully!', 'success');
                return true;
            } else if (response.status === 401 && refreshToken) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    return await updateProfile(profileData);
                } else {
                    showMessage('Session expired. Please log in again.', 'error');
                    return false;
                }
            } else {
                const errorMessage = data.detail || Object.values(data).flat().join(' ');
                showMessage(`Profile update failed: ${errorMessage}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error during profile update:', error);
            showMessage('Network error during profile update. Please try again.', 'error');
            return false;
        } finally {
            setLoadingAuth(false);
        }
    };

    const authContextValue = {
        user,
        isAuthenticated,
        loadingAuth,
        login,
        register,
        logout,
        updateProfile,
        accessToken,
        showMessage,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
        </AuthContext.Provider>
    );
};
