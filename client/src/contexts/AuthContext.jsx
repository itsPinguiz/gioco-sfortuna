import { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, login, logout } from '../api/API';

// ==========================================
// CONSTANTS
// ==========================================

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Credenziali non valide. Riprova.',
  GENERIC_LOGIN: 'Si è verificato un errore durante il login. Riprova più tardi.',
  AUTH_CHECK: 'Errore durante la verifica dell\'autenticazione.'
};

const HTTP_STATUS = {
  UNAUTHORIZED: 401
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Determines the appropriate error message based on the error response
 * @param {Object} error - The error object from the API call
 * @returns {string} User-friendly error message
 */
const getLoginErrorMessage = (error) => {
  if (error.response && error.response.status === HTTP_STATUS.UNAUTHORIZED) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  return ERROR_MESSAGES.GENERIC_LOGIN;
};

/**
 * Logs errors in a consistent format
 * @param {string} operation - The operation that failed
 * @param {Object} error - The error object
 */
const logError = (operation, error) => {
  console.error(`${operation} error:`, error);
};

// ==========================================
// CONTEXT CREATION
// ==========================================

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
export const AuthContext = createContext();

// ==========================================
// PROVIDER COMPONENT
// ==========================================

/**
 * AuthProvider Component
 * Manages authentication state and provides authentication methods
 * to child components through React Context
 * 
 * Features:
 * - Automatic authentication check on app load
 * - Login/logout functionality
 * - Error handling with user-friendly messages
 * - Loading states for async operations
 * 
 * @param {Object} children - Child components to wrap with auth context
 */
export const AuthProvider = ({ children }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Check authentication status on component mount
   * Attempts to retrieve current user session if it exists
   */
  useEffect(() => {
    const checkAuthenticationStatus = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        logError('Authentication check', error);
        // Note: We don't set an error state here as this is expected
        // when no valid session exists
      } finally {
        setLoading(false);
      }
    };

    checkAuthenticationStatus();
  }, []);

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================
  
  /**
   * Handles user login process
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {boolean} Success status of login attempt
   */
  const handleLogin = async (username, password) => {
    try {
      // Clear any previous errors
      setError('');
      
      // Attempt login
      const authenticatedUser = await login(username, password);
      setUser(authenticatedUser);
      
      // Force a small delay to ensure session is established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      logError('Login', error);
      
      // Set user-friendly error message
      const errorMessage = getLoginErrorMessage(error);
      setError(errorMessage);
      
      return false;
    }
  };

  /**
   * Handles user logout process
   * Clears user session both locally and on server
   */
  const handleLogout = async () => {
    try {
      // Attempt server-side logout
      await logout();
    } catch (error) {
      logError('Logout', error);
      // Continue with local logout even if server logout fails
    } finally {
      // Always clear local user state
      setUser(null);
      setError('');
    }
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  
  /**
   * Context value object containing all authentication state and methods
   */
  const contextValue = {
    // User state
    user,
    loading,
    error,
    
    // Computed values
    isAuthenticated: !!user,
    
    // Methods
    login: handleLogin,
    logout: handleLogout,
    
    // Utility methods for components
    clearError: () => setError('')
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM HOOK (Optional convenience export)
// ==========================================

/**
 * Custom hook to use authentication context
 * Provides a convenient way to access auth state and methods
 * 
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
