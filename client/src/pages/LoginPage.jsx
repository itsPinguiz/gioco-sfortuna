import { useState, useContext } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Attempt login
    const success = await login(username, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col md={6} className="mx-auto">
          <h2 className="mb-4">Login</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <Form.Control.Feedback type="invalid">
                Inserisci il tuo username.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Form.Control.Feedback type="invalid">
                Inserisci la tua password.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Button variant="primary" type="submit">
              Accedi
            </Button>
          </Form>
          
          <div className="mt-4">
            <p>
              Non hai un account? Puoi comunque giocare come <a href="/play">ospite</a>.
            </p>
            <p className="text-muted">
              <small>
                Gli utenti ospiti possono giocare solo una partita demo con limitazioni.
              </small>
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
