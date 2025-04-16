// src/App.jsx
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useKindeAuth } from './auth/KindeAuth';
import { KindeAuthProvider } from './auth/KindeAuth';
// import { useState, useEffect } from 'react';
// import { supabase } from './supabase/client';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Notifications from './pages/Notifications';

// Context for the application state
import { AppContextProvider } from './context/AppContext';

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useKindeAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <KindeAuthProvider>
      <AppContextProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/tasks" element={
              <RequireAuth>
                <Tasks />
              </RequireAuth>
            } />
            <Route path="/users" element={
              <RequireAuth>
                <Users />
              </RequireAuth>
            } />
            <Route path="/notifications" element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            } />
          </Routes>
        </Router>
      </AppContextProvider>
    </KindeAuthProvider>
  );
}

export default App;