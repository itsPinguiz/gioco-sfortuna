import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createGame } from '../api/API';
import Footer from '../components/layout/Footer';
import dayjs from 'dayjs';
import userIcon from '../assets/icons/person.png';
import playIcon from '../assets/icons/play.png';
import styles from './HomePage.module.css';

// ==========================================
// CONSTANTS
// ==========================================

const GAME_RULES = [
  { text: 'Inizi con', bold: '3 carte', after: 'che hanno un indice di sfortuna da 1 a 100.' },
  { text: 'Ogni round ti viene mostrata una', bold: 'nuova situazione sfortunata', after: '.' },
  { text: 'Devi collocare la nuova carta tra quelle che hai, in base a', bold: 'quanto è sfortunata.', after: '' },
  { text: 'Hai', bold: '30 secondi', after: 'per decidere!' },
  { text: 'Ottieni', bold: '6 carte', after: 'per vincere.', bold2: '3 errori', after2: 'e hai perso.' }
];

const ERROR_MESSAGES = {
  FETCH_GAMES: 'Errore nel caricamento delle partite. Riprova più tardi.',
  CREATE_GAME: 'Errore nella creazione della partita. Riprova più tardi.'
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Formats date for display in games table
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
const formatGameDate = (dateString) => {
  return dayjs(dateString).format('DD/MM/YYYY HH:mm');
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="text-center mt-3">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Caricamento...</span>
    </div>
  </div>
);

/**
 * New game card component
 */
const NewGameCard = ({ isAuthenticated, onNewGame, loading }) => (
  <Card className="game-card">
    <Card.Body>
      <Card.Title className="game-title">Inizia una nuova partita</Card.Title>
      <Card.Text>
        {isAuthenticated
          ? 'Sfida il computer e cerca di ottenere 6 carte per vincere! Hai 3 tentativi per ogni round.'
          : 'Prova una partita demo con un solo round. Solo un tentativo disponibile! Registrati per partite complete.'}
      </Card.Text>
      <div className="btn-wrapper">
        <Button
          variant="primary"
          onClick={onNewGame}
          disabled={loading}
          className="game-button game-button-primary"
        >
          <span className="icon">
            <img src={playIcon} alt="" />
          </span>
          {loading ? 'Caricamento...' : (isAuthenticated ? 'Nuova Partita' : 'Demo (1 Round)')}
        </Button>
      </div>
    </Card.Body>
  </Card>
);

/**
 * Game rules card component
 */
const GameRulesCard = () => (
  <Card className="game-card">
    <Card.Body>
      <Card.Title className="game-title">Come si gioca</Card.Title>
      <Card.Text>
        {GAME_RULES.map((rule, index) => (
          <div key={index} className={styles.ruleItem}>
            <span className={styles.ruleNumber}>{index + 1}</span>
            <span className={styles.ruleText}>
              {rule.text} <strong>{rule.bold}</strong> {rule.after}
              {rule.bold2 && (
                <> <strong>{rule.bold2}</strong> {rule.after2}</>
              )}
            </span>
          </div>
        ))}
      </Card.Text>
    </Card.Body>
  </Card>
);


/**
 * Login prompt section component
 */
const LoginPromptSection = () => (
  <Row className="mt-4">
    <Col className="text-center">
      <Card className="border-info">
        <Card.Body>
          <Card.Title>Vuoi accedere a tutte le funzionalità?</Card.Title>
          <div>
            <p>
              La demo ti permette di provare il gioco con un solo round e un solo tentativo.
            </p>
            <p><strong>Effettua il login per:</strong></p>
            <ul className="mt-2">
              <li>Giocare partite complete (fino a 6 carte)</li>
              <li>Avere 3 tentativi per ogni round</li>
              <li>Tenere traccia delle tue partite</li>
              <li>Visualizzare statistiche dettagliate</li>
            </ul>
          </div>
          <div className="btn-wrapper">
            <Link to="/login" className="btn btn-primary">
              <span className="icon">
                <img src={userIcon} alt="" />
              </span>
              Accedi per Partite Complete
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * HomePage Component
 * Main landing page showing game introduction and new game options
 * 
 * Features:
 * - Game introduction and rules
 * - New game creation
 * - Login prompt for unauthenticated users
 * - Error handling and loading states
 */
const HomePage = () => {
  // ==========================================
  // HOOKS
  // ==========================================
  
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Set page title for this page
   */
  useEffect(() => {
    document.title = 'Home - Gioco della Sfortuna';
    
    return () => {
      // Reset to default title when component unmounts
      document.title = 'Gioco della Sfortuna - Università Edition';
    };
  }, []);

  // ==========================================
  // API FUNCTIONS
  // ==========================================
  
  /**
   * Creates a new game and navigates to game page
   */
  const handleNewGame = async () => {
    try {
      setLoading(true);
      const gameData = await createGame();

      // Navigate to the game page
      const gameId = gameData.game?.id || gameData.id;
      if (gameId) {
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError(ERROR_MESSAGES.CREATE_GAME);
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <>
      <Container className="mt-4">
        {/* Page header */}
        <Row className="mb-4">
          <Col>
            <div className={styles.pageHeader}>
              <p className={styles.leadText}>
                Metti alla prova la tua capacità di valutare quanto sono sfortunate 
                le situazioni più orribili della vita universitaria!
              </p>
            </div>
          </Col>
        </Row>

        {/* Error display */}
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {/* Main action cards */}
        <Row className={styles.actionCards}>
          <Col md={6} className="mb-4 mb-md-0">
            <NewGameCard 
              isAuthenticated={isAuthenticated}
              onNewGame={handleNewGame}
              loading={loading}
            />
          </Col>
          
          <Col md={6}>
            <GameRulesCard />
          </Col>
        </Row>

        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && <LoginPromptSection />}
      </Container>
      <Footer />
    </>
  );
};
export default HomePage;