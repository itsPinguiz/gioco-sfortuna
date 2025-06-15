import { useState, useContext } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './LoginPage.module.css';

// ==========================================
// CONSTANTS
// ==========================================

const FORM_VALIDATION_MESSAGES = {
  USERNAME_REQUIRED: 'Inserisci il tuo username.',
  PASSWORD_REQUIRED: 'Inserisci la tua password.'
};

const GUEST_INFO = {
  TITLE: 'Non hai un account? Puoi comunque giocare come ospite.',
  DESCRIPTION: 'Gli utenti ospiti possono giocare solo una partita demo con limitazioni.'
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validates form and returns validation status
 * @param {HTMLFormElement} form - The form element to validate
 * @returns {boolean} Whether the form is valid
 */
const validateForm = (form) => {
  return form.checkValidity();
};

/**
 * Gets the redirect path from location state or returns default
 * @param {Object} location - React Router location object
 * @returns {string} Redirect path
 */
const getRedirectPath = (location) => {
  return location.state?.from?.pathname || '/';
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Form input field component
 */
const FormField = ({ 
  controlId, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  validationMessage, 
  required = true 
}) => (
  <Form.Group className="mb-3" controlId={controlId}>
    <Form.Label>{label}</Form.Label>
    <Form.Control
      type={type}
      value={value}
      onChange={onChange}
      required={required}
    />
    <Form.Control.Feedback type="invalid">
      {validationMessage}
    </Form.Control.Feedback>
  </Form.Group>
);

/**
 * Guest information section component
 */
const GuestInfoSection = () => (
  <div className="mt-4">
    <p>
      {GUEST_INFO.TITLE.split('ospite')[0]}
      <a href="/play">ospite</a>
      {GUEST_INFO.TITLE.split('ospite')[1]}
    </p>
    <p className="text-muted">
      <small>{GUEST_INFO.DESCRIPTION}</small>
    </p>
  </div>
);

/**
 * Error alert component
 */
const ErrorAlert = ({ error }) => {
  if (!error) return null;
  
  return <Alert variant="danger">{error}</Alert>;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * LoginPage Component
 * Handles user authentication with form validation and error handling
 * 
 * Features:
 * - Form validation with Bootstrap feedback
 * - Authentication context integration
 * - Redirect to intended destination after login
 * - Guest play option
 * - Responsive design
 */
const LoginPage = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [validated, setValidated] = useState(false);
  
  // ==========================================
  // HOOKS
  // ==========================================
  
  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to home
  const redirectPath = getRedirectPath(location);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  
  /**
   * Handles input field changes
   * @param {string} field - Field name to update
   * @param {string} value - New field value
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handles form submission with validation and authentication
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const form = e.currentTarget;
    if (!validateForm(form)) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Attempt login
    const success = await login(formData.username, formData.password);
    if (success) {
      navigate(redirectPath, { replace: true });
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <Container className={styles.loginContainer}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6}>
          <div className={styles.loginCard}>
            {/* Page header */}
            <h2 className={styles.loginTitle}>Login</h2>
            
            {/* Error display */}
            <ErrorAlert error={error} />
            
            {/* Login form */}
            <Form noValidate validated={validated} onSubmit={handleSubmit} className={styles.loginForm}>
              {/* Username field */}
              <FormField
                controlId="username"
                label="Username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                validationMessage={FORM_VALIDATION_MESSAGES.USERNAME_REQUIRED}
              />
              
              {/* Password field */}
              <FormField
                controlId="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                validationMessage={FORM_VALIDATION_MESSAGES.PASSWORD_REQUIRED}
              />
              
              {/* Submit button */}
              <Button variant="primary" type="submit">
                Accedi
              </Button>
            </Form>
            
            {/* Guest information */}
            <div className={styles.guestInfo}>
              <GuestInfoSection />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
