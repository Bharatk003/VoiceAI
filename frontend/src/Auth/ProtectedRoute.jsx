import React, { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'; // Import LoadingSpinner

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loadingAuth, showMessage } = useContext(AuthContext);

    if (loadingAuth) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        showMessage('You need to be logged in to access this page.', 'error');
        return <p className="text-center text-gray-600 mt-8">Please log in to view this content.</p>;
    }

    return children;
};
