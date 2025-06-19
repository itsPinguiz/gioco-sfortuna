import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getUserGames } from '../api/API';
import Footer from '../components/layout/Footer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
import styles from './GamesHistoryPage.module.css';
import LoadingSpinner from '../components/game/LoadingSpinner';

// ==========================================
// CONSTANTS
// ==========================================

const ERROR_MESSAGES = {
  FETCH_GAMES: 'Errore nel caricamento delle partite. Riprova più tardi.',
  NOT_AUTHENTICATED: 'Devi effettuare il login per vedere lo storico partite.'
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Formats date for display in games table
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string in UTC+2
 */
const formatGameDate = (dateString) => {
  return dayjs(dateString).tz('Europe/Rome').format('DD/MM/YYYY HH:mm');
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
 * Games table row component
 */
const GameTableRow = ({ game }) => {
  const statusBadge = getGameStatusBadge(game);
  const actionButton = getGameActionButton(game);

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
 * Empty games state component
 */
const EmptyGamesState = () => (
  <Card className={styles.emptyCard}>
    <Card.Body className="text-center">
      <div className={styles.emptyIcon}>📊</div>
      <h4>Nessuna partita trovata</h4>
      <p>Non hai ancora giocato nessuna partita.</p>
      <Link to="/" className="btn btn-primary">
        Inizia una nuova partita
      </Link>
    </Card.Body>
  </Card>
);

/**
 * Games statistics component
 */
const GamesStatistics = ({ games }) => {
  const totalGames = games.length;
  const wonGames = games.filter(game => game.result === 'won').length;
  const lostGames = games.filter(game => game.result === 'lost').length;
  const inProgressGames = games.filter(game => !game.end_date).length;
  const winRate = totalGames > 0 ? Math.round((wonGames / (wonGames + lostGames)) * 100) : 0;

  return (
    <Row className="mb-4">
      <Col sm={6} md={3} className="mb-3">
        <Card className={styles.statCard}>
          <Card.Body className="text-center">
            <div className={styles.statNumber}>{totalGames}</div>
            <div className={styles.statLabel}>Totale Partite</div>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={6} md={3} className="mb-3">
        <Card className={styles.statCard}>
          <Card.Body className="text-center">
            <div className={`${styles.statNumber} ${styles.statSuccess}`}>{wonGames}</div>
            <div className={styles.statLabel}>Vittorie</div>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={6} md={3} className="mb-3">
        <Card className={styles.statCard}>
          <Card.Body className="text-center">
            <div className={`${styles.statNumber} ${styles.statDanger}`}>{lostGames}</div>
            <div className={styles.statLabel}>Sconfitte</div>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={6} md={3} className="mb-3">
        <Card className={styles.statCard}>
          <Card.Body className="text-center">
            <div className={styles.statNumber}>{winRate}%</div>
            <div className={styles.statLabel}>Tasso di Vittoria</div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GamesHistoryPage Component
 * Displays user's game history with statistics and detailed table
 */
const GamesHistoryPage = () => {
  // ==========================================
  // HOOKS
  // ==========================================
  
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Set page title
   */
  useEffect(() => {
    document.title = 'Storico Partite - Gioco della Sfortuna';
    
    return () => {
      document.title = 'Gioco della Sfortuna - Università Edition';
    };
  }, []);

  /**
   * Check authentication and load games
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setError(ERROR_MESSAGES.NOT_AUTHENTICATED);
      setLoading(false);
      return;
    }

    // Add a small delay to ensure session is properly established
    const timer = setTimeout(() => {
      fetchGames();
    }, 200);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // ==========================================
  // API FUNCTIONS
  // ==========================================
  
  /**
   * Fetches user's games from the server
   */
const fetchGames = async (retryCount = 0) => {
  try {
    setLoading(true);
    setError('');
    const userGames = await getUserGames();
    setGames(userGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    
    if (error.response?.status === 401) {
      // Retry once after authentication error
      if (retryCount < 1) {
        console.log('Retrying games fetch after authentication delay...');
        setTimeout(() => fetchGames(retryCount + 1), 500);
        return;
      }
      setError(ERROR_MESSAGES.NOT_AUTHENTICATED);
    } else {
      setError(ERROR_MESSAGES.FETCH_GAMES);
    }
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // RENDER
  // ==========================================

  // Redirect to login if not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <>
        <Container className="mt-4">
          <Alert variant="warning">
            <Alert.Heading>Accesso Richiesto</Alert.Heading>
            <p>{ERROR_MESSAGES.NOT_AUTHENTICATED}</p>
            <Link to="/login" className="btn btn-primary">
              Effettua il Login
            </Link>
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Container className="mt-4">
        {/* Page header */}
        <Row className="mb-4">
          <Col>
            <h1 className={styles.pageTitle}>Storico Partite</h1>
            <p className={styles.pageDescription}>
              Rivedi le tue partite passate e tieni traccia dei tuoi progressi
            </p>
          </Col>
        </Row>

        {/* Error display */}
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <LoadingSpinner />
        ) : games.length > 0 ? (
          <>
            {/* Statistics */}
            <GamesStatistics games={games} />

            {/* Games table */}
            <Card className={styles.tableCard}>
              <Card.Header className={styles.tableHeader}>
                <h4 className="mb-0">Tutte le Partite</h4>
              </Card.Header>
              <Card.Body className={styles.tableBody}>
                <div className="table-responsive">
                  <table className={`table table-borderless ${styles.gameTable}`}>
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
              </Card.Body>
            </Card>
          </>
        ) : (
          /* Empty state */
          <EmptyGamesState />
        )}
      </Container>
      <Footer />
    </>
  );
};

export default GamesHistoryPage;
