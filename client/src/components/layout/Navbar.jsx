import { useContext } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import logo from '../../assets/icons/logo.svg';
import userIcon from '../../assets/icons/person.png';

// ==========================================
// CONSTANTS
// ==========================================

const LOGO_CONFIG = {
  height: "40",
  alt: "Gioco della Sfortuna Logo",
  className: "d-inline-block align-top logo-inverted"
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validates authentication context values
 * @param {Object} authContext - Authentication context object
 * @returns {boolean} Whether the context is valid
 */
const isValidAuthContext = (authContext) => {
  return authContext && typeof authContext.isAuthenticated === 'boolean';
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Brand logo component with home navigation and game title
 */
const NavbarBrand = () => (
  <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
    <img
      src={logo}
      height={LOGO_CONFIG.height}
      className={LOGO_CONFIG.className}
      alt={LOGO_CONFIG.alt}
    />
    <span className="ms-3 navbar-game-title">
      Gioco della Sfortuna
    </span>
  </Navbar.Brand>
);

/**
 * Main navigation links component
 */
const MainNavigation = () => (
  <Nav className="me-auto">
    {/* Removed Home link - using only logo for navigation */}
  </Nav>
);

/**
 * Authentication section for logged-in users with dropdown menu
 */
const AuthenticatedUserSection = ({ user, onLogout }) => (
  <NavDropdown
    title={
      <span className="d-flex align-items-center">
        <img 
          src={userIcon} 
          alt="User" 
          style={{ 
            height: '20px', 
            width: '20px', 
            marginRight: '8px',
            filter: 'invert(1)' 
          }} 
        />
        {user.username}
      </span>
    }
    id="user-dropdown"
    align="end"
  >
    <NavDropdown.Item as={Link} to="/games-history">
      Storico Partite
    </NavDropdown.Item>
    <NavDropdown.Divider />
    <NavDropdown.Item onClick={onLogout}>
      Logout
    </NavDropdown.Item>
  </NavDropdown>
);

/**
 * Authentication section for non-authenticated users
 */
const UnauthenticatedUserSection = () => (
  <Nav.Link as={Link} to="/login">Login</Nav.Link>
);

/**
 * User authentication section that renders appropriate content
 * based on authentication status
 */
const UserAuthSection = ({ isAuthenticated, user, onLogout }) => (
  <Nav>
    {isAuthenticated ? (
      <AuthenticatedUserSection user={user} onLogout={onLogout} />
    ) : (
      <UnauthenticatedUserSection />
    )}
  </Nav>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * NavbarComponent
 * Main navigation bar component that provides site navigation
 * and user authentication controls
 * 
 * Features:
 * - Brand logo with home navigation
 * - Main navigation links
 * - User authentication status display
 * - Login/Logout functionality
 * - Responsive design with collapse toggle
 */
const NavbarComponent = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  // ==========================================
  // VALIDATION
  // ==========================================
  
  // Validate authentication context
  if (!isValidAuthContext(authContext)) {
    console.error('Invalid AuthContext provided to Navbar');
    return null;
  }

  const { user, isAuthenticated, logout } = authContext;

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  
  /**
   * Handles user logout process
   * Logs out the user and redirects to home page
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to home even if logout fails on client side
      navigate('/');
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* Brand logo */}
        <NavbarBrand />
        
        {/* Mobile menu toggle */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        {/* Collapsible navigation content */}
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Main navigation links */}
          <MainNavigation />
          
          {/* User authentication section */}
          <UserAuthSection 
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
