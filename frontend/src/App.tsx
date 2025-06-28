import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
import Mentors from './Mentors';
import Requests from './Requests';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>;
  }
  
  return user ? <Navigate to="/profile" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/mentors" element={
              <PrivateRoute>
                <Mentors />
              </PrivateRoute>
            } />
            <Route path="/requests" element={
              <PrivateRoute>
                <Requests />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
