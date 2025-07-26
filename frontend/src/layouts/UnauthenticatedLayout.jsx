import React from 'react';

export const UnauthenticatedLayout = ({ navigate, children }) => {
    return (
        <>
            <header className="bg-indigo-700 text-white p-4 shadow-md">
                <nav className="container mx-auto flex flex-wrap justify-between items-center">
                    <div className="text-2xl font-bold rounded-lg px-3 py-1 bg-indigo-800">
                        AI Voice
                    </div>
                    <div className="flex flex-wrap space-x-4 mt-2 md:mt-0">
                        <button onClick={() => navigate('home')} className="nav-button">Home</button>
                        <button onClick={() => navigate('login')} className="nav-button">Login</button>
                        <button onClick={() => navigate('register')} className="nav-button">Register</button>
                    </div>
                </nav>
            </header>

            <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
                {children}
            </main>

            <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
                <p>&copy; {new Date().getFullYear()} AI Voice Assistant. All rights reserved.</p>
            </footer>
        </>
    );
};