import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import NavbarComponent from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <NavbarComponent />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="container mt-4">
                  <h2>Profilo Utente</h2>
                  <p>Questa pagina è protetta e accessibile solo agli utenti autenticati.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
