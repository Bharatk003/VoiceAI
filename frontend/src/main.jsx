import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './Auth/AuthContext.jsx'; // Import AuthProvider

// Import Tailwind CSS (if you're using it via PostCSS, otherwise keep CDN in index.html)
import './index.css'; // Assuming you have a Tailwind CSS setup in index.css

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
