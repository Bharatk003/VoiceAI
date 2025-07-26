// src/layouts/AuthenticatedLayout.jsx

import React, { useState, useContext } from 'react';
import { Sidebar } from '../components/Sidebar.jsx';
import { AppContext } from '../AppContext.jsx'; // Import AppContext

export const AuthenticatedLayout = ({ currentPage, handleLogout, children }) => { // Removed navigate from props
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { navigate } = useContext(AppContext); // Get navigate from AppContext

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const mainContentMarginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Toggle Button for Mobile */}
            <button
                className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-indigo-700 text-white shadow-lg"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            {/* Sidebar Component */}
            <Sidebar
                currentPage={currentPage}
                navigate={navigate} // Pass navigate from AppContext
                handleLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isSidebarCollapsed={isSidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${mainContentMarginClass}`}>
                <main className="flex-grow p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>

                <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
                    <p>&copy; {new Date().getFullYear()} AI Voice Assistant. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};