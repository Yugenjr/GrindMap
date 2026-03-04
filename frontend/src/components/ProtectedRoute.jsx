import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    // Redirect to login if no token or user found
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
