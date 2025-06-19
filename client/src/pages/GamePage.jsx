import { useState, useEffect, useContext } from 'react';
import { Container, Alert, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createGame } from '../api/API';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/game/LoadingSpinner';

// Custom hooks
import useGameState from '../hooks/useGameState';
import useGameTimer from '../hooks/useGameTimer';

// Components
import { CardHand, GameRound, GameResult, GameOver } from '../components/game';

// Styles
import './GamePage.css';

// ==========================================
// CONSTANTS
// ==========================================

const TIMER_DURATION = 30; // seconds
const DEMO_MODAL_CONFIG = {
  TITLE: 'Partita Demo - Un Solo Round',
  CONTENT: {
    DESCRIPTION: 'Stai giocando una partita demo limitata ad un solo round. Il progresso non verrà salvato nel tuo profilo.',
    FEATURES_TITLE: 'Limitazioni della demo',
    FEATURES: [
      { text: 'Solo', bold: '1 round', after: 'disponibile' },
      { text: 'La partita termina dopo il', bold: 'primo tentativo', after: '' },
      { text: '', bold: 'Nessun salvataggio', after: 'del progresso' }
    ],
    BENEFITS_TITLE: 'Accedi per',
    BENEFITS: [
      { text: 'Giocare partite', bold: 'complete', after: '(fino a 6 carte)' },
      { text: 'Avere', bold: '3 tentativi', after: 'per round' },
      { text: '', bold: 'Salvare', after: 'le tue partite' },
      { text: 'Visualizzare la', bold: 'cronologia', after: '' }
    ]
  },
  BUTTONS: {
    CONTINUE_DEMO: 'Continua la demo',
    LOGIN: 'Accedi per partita completa'
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Determines if cards should be shown in the current phase
 * @param {string} gamePhase - Current game phase
 * @param {Object} roundResult - Current round result
 * @returns {Object} Display configuration for cards
 */
const getCardsDisplayConfig = (gamePhase, roundResult) => {
  const shouldShow = gamePhase === 'result';
  const showIndex = shouldShow && roundResult?.result === 'incorrect';

  return { shouldShow, showIndex };
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Loading state component
 */
const LoadingState = () => (
  <Container className="mt-4 text-center">
    <LoadingSpinner />
  </Container>
);

/**
 * Error state component
 */
const ErrorState = ({ error, onNavigateHome }) => (
  <Container className="mt-4">
    <Alert variant="danger">
      <Alert.Heading>Errore</Alert.Heading>
      <p>{error}</p>
      <Button variant="outline-danger" onClick={onNavigateHome}>
        Torna alla Home
      </Button>
    </Alert>
  </Container>
);

/**
 * Demo game modal component
 */
const DemoGameModal = ({ show, onHide, onLogin }) => (
  <Modal
    show={show}
    onHide={onHide}
    backdrop="static"
    keyboard={false}
    centered
    size="lg"
  >
    <Modal.Header>
      <Modal.Title>{DEMO_MODAL_CONFIG.TITLE}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>{DEMO_MODAL_CONFIG.CONTENT.DESCRIPTION}</p>

      <div className="row">
        <div className="col-md-6 mb-3">
          <p><strong>{DEMO_MODAL_CONFIG.CONTENT.FEATURES_TITLE}</strong></p>
          <ul className="demo-list demo-limitations">
            {DEMO_MODAL_CONFIG.CONTENT.FEATURES.map((feature, index) => (
              <li key={index}>
                <span className="demo-bullet demo-limitation-bullet">{index + 1}</span>
                <span className="demo-text">
                  {feature.text} <strong>{feature.bold}</strong> {feature.after}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-md-6">
          <p><strong>{DEMO_MODAL_CONFIG.CONTENT.BENEFITS_TITLE}</strong></p>
          <ul className="demo-list demo-benefits">
            {DEMO_MODAL_CONFIG.CONTENT.BENEFITS.map((benefit, index) => (
              <li key={index}>
                <span className="demo-bullet demo-benefit-bullet">{index + 1}</span>
                <span className="demo-text">
                  {benefit.text} <strong>{benefit.bold}</strong> {benefit.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        {DEMO_MODAL_CONFIG.BUTTONS.CONTINUE_DEMO}
      </Button>
      <Button variant="primary" onClick={onLogin}>
        {DEMO_MODAL_CONFIG.BUTTONS.LOGIN}
      </Button>
    </Modal.Footer>
  </Modal>
);

/**
 * Game content renderer based on current phase
 */
const GameContent = ({
  gamePhase,
  roundCard,
  cards,
  rounds,
  roundResult,
  game,
  timeLeft,
  incorrectAttempts,
  onPlaceCard,
  onTimeUp,
  onContinue,
  onNewGame
}) => {
  switch (gamePhase) {
    case 'round':
      return (
        <GameRound
          roundCard={roundCard}
          cards={cards}
          onPlaceCard={onPlaceCard}
          onTimeUp={onTimeUp}
          timeLeft={timeLeft}
          incorrectAttempts={incorrectAttempts}
        />
      );

    case 'result':
      return (
        <GameResult
          result={roundResult}
          card={roundCard}
          cards={cards}
          onContinue={onContinue}
          timeLeft={timeLeft}
          incorrectAttempts={incorrectAttempts}
        />
      );

    case 'over':
      return (
        <GameOver
          game={game}
          cards={cards}
          rounds={rounds}
          incorrectAttempts={incorrectAttempts}
          onNewGame={onNewGame}
        />
      );

    default:
      return null;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GamePage Component
 * Main game page that orchestrates the entire game flow using custom hooks
 * for state management and timer functionality
 * 
 * Features:
 * - Game state management with persistence
 * - Timer functionality with localStorage persistence
 * - Phase-based rendering (round, result, game over)
 * - Demo game modal for unauthenticated users
 * - Error handling and loading states
 * - Automatic game flow management
 */
const GamePage = () => {
  // ==========================================
  // HOOKS
  // ==========================================

  const { gameId } = useParams();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // ==========================================
  // CUSTOM HOOKS
  // ==========================================
  // Game state management
  const {
    game,
    cards,
    rounds,
    loading,
    error,
    roundCard,
    gamePhase,
    roundResult,
    incorrectAttempts,
    handlePlaceCard,
    handleTimeUp,
    startNewRound,
    clearGameState
  } = useGameState(gameId);

  // Game timer with persistence
  const {
    timeLeft,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    clearTimerFromLocalStorage
  } = useGameTimer(TIMER_DURATION, handleTimeUp, gameId);

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [showDemoModal, setShowDemoModal] = useState(false);

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Update demo modal visibility based on authentication status
   */
  useEffect(() => {
    setShowDemoModal(!isAuthenticated);
  }, [isAuthenticated]);

  /**
   * Start/stop timer based on game phase
   */
  useEffect(() => {
    if (gamePhase === 'round' && roundCard) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [gamePhase, roundCard, startTimer, stopTimer]);

  /**
   * Start first round when game is loaded
   */
  useEffect(() => {
    if (!loading && gamePhase === 'round' && !roundCard) {
      startNewRound();
    }
  }, [loading, gamePhase, roundCard, startNewRound]);

  /**
   * Cleanup timer when component unmounts
   */
  useEffect(() => {
    return () => {
      // Pause timer when leaving the game page (preserves time but stops execution)
      pauseTimer();
    };
  }, [pauseTimer]);

  /**
   * Set page title for game page
   */
  useEffect(() => {
    document.title = 'Partita in corso - Gioco della Sfortuna';

    return () => {
      document.title = 'Gioco della Sfortuna - Università Edition';
    };
  }, []);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Handles card placement with timer management
   */
  const onPlaceCard = async (cardId, position) => {
    stopTimer();
    await handlePlaceCard(cardId, position);
  };

  /**
   * Handles continuing to next round with timer reset
   */
  const onContinue = async () => {
    resetTimer(); // Reset timer when starting new round
    await startNewRound();
  };
  /**
   * Handles starting a new game with cleanup
   */
  const onNewGame = async () => {
    try {
      // Clear both timer and game state data for current game before starting new one
      if (gameId) {
        clearTimerFromLocalStorage();
        clearGameState(); // Clear game state from localStorage
      }

      const result = await createGame();
      const newGameId = result?.game?.id || result?.id;

      if (newGameId) {
        navigate(`/game/${newGameId}`);
      }
    } catch (error) {
      console.error('Failed to create new game:', error);
    }
  };

  /**
   * Handles demo modal login button
   */
  const handleDemoLogin = () => {
    navigate('/login');
  };

  /**
   * Handles navigation to home page
   */
  const handleNavigateHome = () => {
    navigate('/');
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const cardsDisplayConfig = getCardsDisplayConfig(gamePhase, roundResult);

  // ==========================================
  // RENDER
  // ==========================================

  // Show loading state
  if (loading) {
    return (
      <>
        <LoadingState />
        <Footer />
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <ErrorState error={error} onNavigateHome={handleNavigateHome} />
        <Footer />
      </>
    );
  }

  // Main game render
  return (
    <>
      <Container className="game-container">
        {/* Game content based on current phase */}
        <GameContent
          gamePhase={gamePhase}
          roundCard={roundCard}
          cards={cards}
          rounds={rounds}
          roundResult={roundResult}
          game={game}
          timeLeft={timeLeft}
          incorrectAttempts={incorrectAttempts}
          onPlaceCard={onPlaceCard}
          onTimeUp={handleTimeUp}
          onContinue={onContinue}
          onNewGame={onNewGame}
        />

        {/* Cards collection - shown only in result phase */}
        {cardsDisplayConfig.shouldShow && (
          <CardHand
            cards={cards}
            showIndex={cardsDisplayConfig.showIndex}
          />
        )}

        {/* Demo game modal */}
        <DemoGameModal
          show={showDemoModal}
          onHide={() => setShowDemoModal(false)}
          onLogin={handleDemoLogin}
        />
      </Container>
      <Footer />
    </>
  );
};

export default GamePage;
