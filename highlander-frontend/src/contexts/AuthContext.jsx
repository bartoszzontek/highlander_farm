// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Sprawdzamy, czy token już istnieje przy starcie
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isLoggedIn());

  const login = async (username, password) => {
    try {
      await authService.login(username, password);
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
      throw error; // Przekaż błąd do formularza logowania
    }
  };

  const logout = () => {
    authService.logout(); // To przekieruje stronę
    setIsLoggedIn(false);
  };

  const value = {
    isLoggedIn,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook do łatwego używania kontekstu
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  return context;
}
