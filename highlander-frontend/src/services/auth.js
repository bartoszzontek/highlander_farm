// src/services/auth.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const AUTH_TOKEN_KEY = 'highlander_auth_token';
const REFRESH_TOKEN_KEY = 'highlander_refresh_token';

export const authService = {
  
  /**
   * Próbuje zalogować użytkownika do /api/token/
   */
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Nieprawidłowa nazwa użytkownika lub hasło');
    }

    const tokens = await response.json();
    authService.setTokens(tokens);
    return tokens;
  },

  /**
   * Usuwa tokeny i wylogowuje
   */
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Przekierowujemy do logowania
    window.location.replace('/login');
  },

  /**
   * Zapisuje tokeny w localStorage
   */
  setTokens: (tokens) => {
    localStorage.setItem(AUTH_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },

  /**
   * Pobiera token dostępowy
   */
  getAccessToken: () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Pobiera token odświeżający
   */
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Sprawdza, czy token istnieje (prosta walidacja)
   */
  isLoggedIn: () => {
    const token = authService.getAccessToken();
    return !!token; // Zwraca true, jeśli token istnieje
    // TODO: W przyszłości można dekodować token i sprawdzać datę wygaśnięcia
  },
  
  // TODO: Dodać logikę odświeżania tokena
};
