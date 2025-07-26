// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider, AuthContext } from './auth/AuthContext.jsx'; // Import AuthContext as well
import { AppProvider } from './AppContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      {/* Consume AuthContext here and pass its values as props to AppProvider */}
      <AuthContext.Consumer>
        {({ accessToken, isAuthenticated, loadingAuth, showMessage }) => (
          <AppProvider
            accessToken={accessToken}
            isAuthenticated={isAuthenticated}
            loadingAuth={loadingAuth}
            showMessage={showMessage}
          >
            <App />
          </AppProvider>
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  </React.StrictMode>,
);