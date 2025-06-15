import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createGame, getUserGames } from '../api/API';
import dayjs from 'dayjs';
import userIcon from '../assets/icons/person.png';
import playIcon from '../assets/icons/play.png';
import styles from './HomePage.module.css';

// ==========================================
// CONSTANTS
// ==========================================

const GAME_RULES = [
  'Inizi con 3 carte che hanno un indice di sfortuna da 1 a 100.',
  'Ogni round ti viene mostrata una nuova situazione sfortunata.',
  'Devi collocare la nuova carta tra quelle che hai, in base a quanto è sfortunata.',
  'Hai 30 secondi per decidere!',
  'Ottieni 6 carte per vincere. 3 errori e hai perso.'
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

/**
 * Gets appropriate badge variant and text for game status
 * @param {Object} game - Game object
 * @returns {Object} Badge configuration
 */
const getGameStatusBadge = (game) => {
  if (!game.end_date) {
    return { variant: 'warning', text: 'In corso' };
  }
  return game.result === 'won' 
    ? { variant: 'success', text: 'Vittoria' }
    : { variant: 'danger', text: 'Sconfitta' };
};

/**
 * Gets appropriate button configuration for game actions
 * @param {Object} game - Game object
 * @returns {Object} Button configuration
 */
const getGameActionButton = (game) => {
  if (!game.end_date) {
    return { variant: 'primary', text: 'Continua' };
  }
  return { variant: 'secondary', text: 'Dettagli' };
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
  <Card className="h-100">
    <Card.Body>
      <Card.Title>Inizia una nuova partita</Card.Title>
      <Card.Text>
        {isAuthenticated
          ? 'Sfida il computer e cerca di ottenere 6 carte per vincere!'
          : 'Prova una partita demo con una sola mano. Registrati per giocare partite complete!'}
      </Card.Text>
      <div className="btn-wrapper">
        <Button
          variant="primary"
          onClick={onNewGame}
          disabled={loading}
        >
          <span className="icon">
            <img src={playIcon} alt="" />
          </span>
          {loading ? 'Caricamento...' : 'Nuova Partita'}
        </Button>
      </div>
    </Card.Body>
  </Card>
);

/**
 * Game rules card component
 */
const GameRulesCard = () => (
  <Card className="h-100">
    <Card.Body>
      <Card.Title>Come si gioca</Card.Title>
      <Card.Text>
        {GAME_RULES.map((rule, index) => (
          <span key={index}>
            {index + 1}. {rule}
            {index < GAME_RULES.length - 1 && <><br /></>}
          </span>
        ))}
      </Card.Text>
    </Card.Body>
  </Card>
);

/**
 * Games table row component
 */
const GameTableRow = ({ game }) => {
  const statusBadge = getGameStatusBadge(game);
  const actionButton = getGameActionButton(game);

  // Determine CSS classes for badges and buttons
  const badgeClass = `${styles.statusBadge} ${
    statusBadge.variant === 'success' ? styles.statusSuccess :
    statusBadge.variant === 'danger' ? styles.statusDanger :
    styles.statusWarning
  }`;

  const buttonClass = `${styles.tableActionButton} ${
    actionButton.variant === 'primary' ? styles.tableActionPrimary : styles.tableActionSecondary
  }`;

  return (
    <tr key={game.id}>
      <td>{formatGameDate(game.start_date)}</td>
      <td>{game.cards_count}</td>
      <td>
        <span className={badgeClass}>
          {statusBadge.text}
        </span>
      </td>
      <td>
        <Link 
          to={`/game/${game.id}`} 
          className={buttonClass}
        >
          {actionButton.text}
        </Link>
      </td>
    </tr>
  );
};

/**
 * Games history section component
 */
const GamesHistorySection = ({ games, loading }) => (
  <div className={styles.historySection}>
    <h2 className={styles.historyTitle}>Le tue partite recenti</h2>

    {loading ? (
      <LoadingSpinner />
    ) : games.length > 0 ? (
      <div className="table-responsive mt-3">
        <table className={`table ${styles.gameTable}`}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Carte</th>
              <th>Risultato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <GameTableRow key={game.id} game={game} />
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className={styles.emptyGames}>
        <p>Non hai ancora giocato nessuna partita.</p>
      </div>
    )}
  </div>
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
          <Card.Text>
            Effettua il login per tenere traccia delle tue partite e giocare partite complete!
          </Card.Text>
          <div className="btn-wrapper">
            <Link to="/login" className="btn btn-primary">
              <span className="icon">
                <img src={userIcon} alt="" />
              </span>
              Accedi
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
 * Main landing page showing game introduction, new game options,
 * and user's game history (if authenticated)
 * 
 * Features:
 * - Game introduction and rules
 * - New game creation
 * - Games history for authenticated users
 * - Login prompt for unauthenticated users
 * - Error handling and loading states
 */
const HomePage = () => {
  // ==========================================
  // HOOKS
  // ==========================================
  
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [games, setGames] = useState([]);
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

  /**
   * Load user's games history when authentication status changes
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchGames();
    } else {
      // Clear games and error when not authenticated
      setGames([]);
      setError('');
    }
  }, [isAuthenticated]);

  // ==========================================
  // API FUNCTIONS
  // ==========================================
  
  /**
   * Fetches user's games from the server
   */
  const fetchGames = async () => {
    // Double check authentication before making the call
    if (!isAuthenticated) {
      console.log('Skipping fetchGames - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const userGames = await getUserGames();
      setGames(userGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      
      // Handle authentication errors gracefully
      if (error.response?.status === 401) {
        console.log('Authentication error when fetching games - user might have been logged out');
        setError('');
        setGames([]);
      } else {
        setError(ERROR_MESSAGES.FETCH_GAMES);
      }
    } finally {
      setLoading(false);
    }
  };

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
    <Container className="mt-4">
      {/* Page header */}
      <Row className="mb-4">
        <Col>
          <div className={styles.pageHeader}>
            <h1 className={styles.mainTitle}>Gioco della Sfortuna</h1>
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
          <Card className={styles.gameCard}>
            <Card.Body>
              <Card.Title>Inizia una nuova partita</Card.Title>
              <Card.Text>
                {isAuthenticated
                  ? 'Sfida il computer e cerca di ottenere 6 carte per vincere!'
                  : 'Prova una partita demo con una sola mano. Registrati per giocare partite complete!'}
              </Card.Text>
              <div className="btn-wrapper">
                <Button
                  variant="primary"
                  onClick={handleNewGame}
                  disabled={loading}
                >
                  <span className="icon">
                    <img src={playIcon} alt="" />
                  </span>
                  {loading ? 'Caricamento...' : 'Nuova Partita'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className={styles.gameCard}>
            <Card.Body>
              <Card.Title>Come si gioca</Card.Title>
              <Card.Text>
                {GAME_RULES.map((rule, index) => (
                  <span key={index}>
                    {index + 1}. {rule}
                    {index < GAME_RULES.length - 1 && <><br /></>}
                  </span>
                ))}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Conditional sections based on authentication */}
      {isAuthenticated ? (
        <GamesHistorySection games={games} loading={loading} />
      ) : (
        <LoginPromptSection />
      )}
    </Container>
  );
};

export default HomePage;
