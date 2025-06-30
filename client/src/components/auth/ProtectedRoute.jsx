import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../game/LoadingSpinner';

// Protected route component that redirects to login if user is not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // If authentication is still loading, show nothing
  if (loading) {
    return (
      <LoadingSpinner/>
    );
  }
  
  // If not authenticated, redirect to login with the current location for redirect after login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
