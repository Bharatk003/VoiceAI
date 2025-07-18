import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext.jsx';
import { LoadingSpinner } from '../components/LoadingSpinner.jsx';

export const ProfilePage = () => {
    const { user, loadingAuth, updateProfile } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateProfile(formData);
    };

    if (loadingAuth || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">User Profile</h2>
            <div className="mb-6 text-gray-700">
                <p className="mb-2"><span className="font-semibold">Username:</span> {user.username}</p>
                <p className="mb-2"><span className="font-semibold">Joined:</span> {new Date(user.date_joined).toLocaleDateString()}</p>
                <p className="mb-2"><span className="font-semibold">Last Login:</span> {new Date(user.last_login).toLocaleString()}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
                        First Name
                    </label>
                    <input
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        id="first_name"
                        type="text"
                        placeholder="First Name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
                        Last Name
                    </label>
                    <input
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        id="last_name"
                        type="text"
                        placeholder="Last Name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
                </div>
                {/* Email is read-only as per serializer */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                        id="email"
                        type="email"
                        value={formData.email}
                        readOnly
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
                        type="submit"
                        disabled={loadingAuth}
                    >
                        {loadingAuth ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};
