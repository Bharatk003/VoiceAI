// src/App.jsx

import React, { useContext } from 'react'; // Removed useState
import { AuthContext } from './auth/AuthContext.jsx';
import { AppContext } from './AppContext.jsx'; // Import AppContext
import { UnauthenticatedLayout } from './layouts/UnauthenticatedLayout.jsx';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { SpeechToTextPage } from './pages/SpeechToTextPage.jsx';
import { VoicesPage } from './pages/VoicesPage.jsx';

function App() {
    const { isAuthenticated, logout } = useContext(AuthContext);
    const { currentPage, navigate } = useContext(AppContext); // Get currentPage and navigate from AppContext

    const handleLogout = async () => {
        await logout();
        navigate('home');
    };

    const renderPage = () => {
        const pageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
        const pageParams = typeof currentPage === 'object' ? currentPage.params : {};

        switch (pageName) {
            case 'home':
                return <HomePage navigate={navigate} />;
            case 'login':
                return <LoginPage navigate={navigate} />;
            case 'register':
                return <RegisterPage navigate={navigate} />;
            case 'profile':
                return <ProfilePage />;
            case 'dashboard':
                return <DashboardPage />;
            case 'speech-to-text':
                return <SpeechToTextPage initialSessionId={pageParams.sessionId} />;
            case 'voices':
                return <VoicesPage navigate={navigate} />;
            default:
                return <HomePage navigate={navigate} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-inter antialiased flex flex-col">
            {isAuthenticated ? (
                <AuthenticatedLayout
                    currentPage={typeof currentPage === 'string' ? currentPage : currentPage.page}
                    navigate={navigate}
                    handleLogout={handleLogout}
                >
                    {renderPage()}
                </AuthenticatedLayout>
            ) : (
                <UnauthenticatedLayout navigate={navigate}>
                    {renderPage()}
                </UnauthenticatedLayout>
            )}
        </div>
    );
}

export default App;