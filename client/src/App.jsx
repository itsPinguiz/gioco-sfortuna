import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/common.css'; // Importa stili comuni
import './App.css';

// ==========================================
// IMPORTS
// ==========================================

// Components - imported from main index file
import { NavbarComponent, ProtectedRoute } from './components';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================

/**
 * App Component
 * Main application component that sets up routing, authentication,
 * and global layout structure
 * 
 * Features:
 * - React Router for navigation
 * - Authentication context provider
 * - Protected routes for authenticated content
 * - Global navigation bar
 * - Bootstrap styling
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          {/* Global navigation */}
          <NavbarComponent />
          
          {/* Application routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            
            {/* Protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="container mt-4">
                  <h2>Profilo Utente</h2>
                  <p>Questa pagina è protetta e accessibile solo agli utenti autenticati.</p>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
