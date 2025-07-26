import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext.jsx';

export const Sidebar = ({ currentPage, navigate, handleLogout, isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, toggleSidebarCollapse }) => {
    const { user } = useContext(AuthContext);

    const navItemsTop = [
        { name: 'Home', page: 'home', icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        )},
        { name: 'Dashboard', page: 'dashboard', icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
        )},
        { name: 'Speech to Text', page: 'speech-to-text', icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
        )},
        { name: 'Voices History', page: 'voices', icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        )},
    ];

    const navItemsBottom = [
        { name: 'Profile', page: 'profile', icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        )},
        { name: 'Logout', action: handleLogout, icon: (
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="17 16 22 12 17 8"></polyline>
                <line x1="22" y1="12" x2="10" y2="12"></line>
            </svg>
        )},
    ];

    return (
        <>
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <aside
                className={`transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 fixed inset-y-0 left-0 z-40 bg-gray-900 text-white shadow-lg
                transition-all duration-300 ease-in-out flex flex-col
                ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`} 
            >
                {/* Sidebar Header/Logo */}
                <div className={`flex items-center h-16 bg-indigo-800 shadow-md transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                    {!isSidebarCollapsed && (
                        <span className="text-2xl font-bold rounded-lg px-3 py-1">AI Voice</span>
                    )}
                    <button
                        className="md:hidden text-white" // Mobile close button
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    {/* Desktop Collapse Toggle Button */}
                    <button
                        className="hidden md:block text-white focus:outline-none"
                        onClick={toggleSidebarCollapse}
                    >
                        <svg className={`w-6 h-6 transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className={`p-4 border-b border-gray-700 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                        <p className="font-semibold text-lg">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                )}

                {/* Top Navigation Links */}
                <nav className="flex-grow p-4 space-y-2">
                    {navItemsTop.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => { navigate(item.page); setIsSidebarOpen(false); }}
                            className={`flex items-center w-full px-4 py-2 rounded-lg text-left transition-colors duration-200
                                ${currentPage === item.page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'}
                                ${isSidebarCollapsed ? 'justify-center' : ''}`} 
                        >
                            <span className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>} {/* Hide text when collapsed */}
                        </button>
                    ))}
                </nav>

                {/* Bottom Navigation Links (Profile, Logout) */}
                <div className="p-4 border-t border-gray-700 space-y-2">
                    {navItemsBottom.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                if (item.action) {
                                    item.action();
                                } else {
                                    navigate(item.page);
                                }
                                setIsSidebarOpen(false); // Close sidebar after action/navigation
                            }}
                            className={`flex items-center w-full px-4 py-2 rounded-lg text-left transition-colors duration-200
                                ${currentPage === item.page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'}
                                ${item.name === 'Logout' ? 'text-red-400 hover:bg-red-700' : ''}
                                ${isSidebarCollapsed ? 'justify-center' : ''}`}  
                        >
                            <span className={`${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`}>{item.icon}</span>
                            {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>} {/* Hide text when collapsed */}
                        </button>
                    ))}
                </div>
            </aside>
        </>
    );
};