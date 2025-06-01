import { createContext, useState, useEffect } from 'react';
import { getCurrentUser, login, logout } from '../api/API';

// Create authentication context
export const AuthContext = createContext();

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle login
  const handleLogin = async (username, password) => {
    try {
      setError('');
      const user = await login(username, password);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.status === 401) {
        setError('Credenziali non valide. Riprova.');
      } else {
        setError('Si è verificato un errore durante il login. Riprova più tardi.');
      }
      return false;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
