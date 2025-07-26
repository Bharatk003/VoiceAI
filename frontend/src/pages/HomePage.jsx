// src/pages/HomePage.jsx

import React, { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext.jsx';

// Accept navigate prop
export const HomePage = ({ navigate }) => { // <--- ENSURE navigate PROP IS ACCEPTED HERE
    const { isAuthenticated } = useContext(AuthContext);

    const features = [
        {
            title: "Universal Transcription + Summary",
            description: "Upload recordings or record live to get accurate transcriptions, concise summaries, and key points. Perfect for lectures, meetings, or patient dictation.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )
        },
        {
            title: "Smart Q&A Over Transcript",
            description: "Ask your AI co-pilot direct questions about any part of your recorded content. Get instant answers, clarifications, or next action items.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="9" y1="10" x2="15" y2="10"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
            )
        },
        {
            title: "Personalized History & Search",
            description: "Every session is saved and easily searchable. Find specific topics or revisit old discussions with powerful AI-driven search.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <path d="M10 2v4a2 2 0 0 0 2 2h4"></path>
                    <path d="M16 16V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                </svg>
            )
        },
        {
            title: "Voice Journal / Thought Capture",
            description: "Record your thoughts, brainstorm ideas, or journal via voice. The AI transcribes, summarizes, and even suggests next steps.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
            )
        },
    ];

    const useCases = [
        { role: "Students", benefit: "Record lectures, transcribe notes, auto-summarize lessons." },
        { role: "Parents", benefit: "Record parent-teacher meetings, get feedback summaries." },
        { role: "Doctors", benefit: "Dictate notes, transcribe patient sessions, get key points." },
        { role: "Engineers", benefit: "Record tech meetings, get action items, extract decisions." },
        { role: "Coaches", benefit: "Track client sessions, generate improvement suggestions." },
        { role: "Freelancers", benefit: "Capture client calls, summarize objections and ideas." },
        { role: "Anyone", benefit: "Record daily thoughts, journal via voice, get Q&A assistance." },
    ];

    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white py-20 px-4 rounded-lg shadow-xl text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
                    Your AI Co-Pilot for Every Conversation
                </h1>
                <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up">
                    Transcribe, summarize, and understand any audio – from any person, in any field.
                </p>
                {!isAuthenticated && (
                    <div className="space-x-4 animate-fade-in-up-delay">
                        <a
                            href="#" // Changed to #
                            onClick={(e) => { e.preventDefault(); navigate('login'); }} // <--- MODIFIED HERE
                            className="bg-white text-indigo-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-lg transition duration-300 shadow-lg inline-block"
                        >
                            Get Started
                        </a>

                        <a
                            href="#" // Changed to #
                            onClick={(e) => { e.preventDefault(); navigate('register'); }} // <--- MODIFIED HERE
                            className="border-2 border-white text-white hover:bg-white hover:text-indigo-700 font-bold py-3 px-8 rounded-full text-lg transition duration-300 inline-block"
                        >
                            Sign Up Free
                        </a>
                    </div>
                )}
            </section>

            {/* Features Section */}
            <section className="py-12 px-4 mb-12">
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-10">Powerful Features, Universal Impact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
                            <div className="mb-4 p-3 bg-gray-100 rounded-full">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="bg-indigo-50 py-12 px-4 rounded-lg shadow-md mb-12">
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-10">Who Can Benefit? Everyone.</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                            <h3 className="text-xl font-semibold text-indigo-700 mb-2">{useCase.role}</h3>
                            <p className="text-gray-700 text-base">{useCase.benefit}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final Call to Action (if not authenticated) */}
            {!isAuthenticated && (
                <section className="bg-indigo-700 text-white py-16 px-4 rounded-lg shadow-xl text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Conversations?</h2>
                    <p className="text-xl mb-8 opacity-90">Sign up now and experience the power of AI-driven insights.</p>
                    <a
                        href="#" // Changed to #
                        onClick={(e) => { e.preventDefault(); navigate('register'); }} // <--- MODIFIED HERE
                        className="bg-white text-indigo-700 hover:bg-gray-100 font-bold py-3 px-10 rounded-full text-xl transition duration-300 shadow-lg inline-block"
                    >
                        Start Your Free Trial
                    </a>
                </section>
            )}
        </div>
    );
};