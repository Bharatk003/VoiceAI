import React, { useState, useContext } from 'react';
import { AuthContext } from './Auth/AuthContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const { isAuthenticated, logout } = useContext(AuthContext);

    const navigate = (page) => {
        setCurrentPage(page);
    };

    const handleLogout = async () => {
        await logout();
        navigate('home'); // Redirect to home after logout
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage />;
            case 'login':
                return <LoginPage navigate={navigate} />;
            case 'register':
                return <RegisterPage navigate={navigate} />;
            case 'profile':
                return <ProfilePage />;
            case 'dashboard':
                return <DashboardPage />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div class="min-h-screen bg-gray-100 font-inter antialiased flex flex-col">
            {/* These links should ideally be in your public/index.html or handled by a proper Tailwind setup */}
            {/* <script src="https://cdn.tailwindcss.com"></script> */}
            {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" /> */}
            {/* <style>
                {`
                body {
                    font-family: 'Inter', sans-serif;
                }
                `}
            </style> */}

            <header class="bg-indigo-600 text-white p-4 shadow-md">
                <nav class="container mx-auto flex flex-wrap justify-between items-center">
                    <div class="text-2xl font-bold rounded-lg px-3 py-1 bg-indigo-500">
                        AI Voice
                    </div>
                    <div class="flex flex-wrap space-x-4 mt-2 md:mt-0">
                        <button onClick={() => navigate('home')} class="nav-button">Home</button>
                        {isAuthenticated ? (
                            <>
                                <button onClick={() => navigate('dashboard')} class="nav-button">Dashboard</button>
                                <button onClick={() => navigate('profile')} class="nav-button">Profile</button>
                                <button onClick={handleLogout} class="nav-button bg-red-600 hover:bg-red-700">Logout</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => navigate('login')} class="nav-button">Login</button>
                                <button onClick={() => navigate('register')} class="nav-button">Register</button>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <main class="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
                {renderPage()}
            </main>

            <footer class="bg-gray-800 text-white text-center p-4 mt-auto">
                <p>&copy; {new Date().getFullYear()} AI Voice Assistant. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default App;
