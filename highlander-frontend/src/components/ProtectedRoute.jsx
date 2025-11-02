// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // Użytkownik nie jest zalogowany, przekieruj do /login
    return <Navigate to="/login" replace />;
  }

  // Użytkownik zalogowany, renderuj komponent (np. MainLayout)
  return children ? children : <Outlet />;
}
