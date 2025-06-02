import { useState, useEffect, useContext } from 'react';
import { Container, Alert, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createGame } from '../api/API';

// Custom hooks
import useGameState from '../hooks/useGameState';
import useGameTimer from '../hooks/useGameTimer';

// Components
import { CardHand, GameRound, GameResult, GameOver } from '../components/game';

// Styles
import './GamePage.css';

/**
 * Main Game Page Component
 * Uses custom hooks for better separation of concerns
 */
const GamePage = () => {
  const { gameId } = useParams();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Use our custom hooks
  const {
    game,
    cards,
    loading,
    error,
    roundCard,
    gamePhase,
    roundResult,
    incorrectAttempts,
    handlePlaceCard,
    handleTimeUp,
    startNewRound
  } = useGameState(gameId);  // Game timer with callback to handleTimeUp and gameId for persistence
  const {
    timeLeft,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    clearTimerFromLocalStorage
  } = useGameTimer(30, handleTimeUp, gameId);
  // Demo game modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // Aggiorna lo stato del modal quando cambia isAuthenticated
  useEffect(() => {
    setShowDemoModal(!isAuthenticated);
  }, [isAuthenticated]);

  // Start the timer when round starts
  useEffect(() => {
    // If we're in the round phase, start the timer
    if (gamePhase === 'round' && roundCard) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [gamePhase, roundCard, startTimer, stopTimer]);
  // Start first round when game is loaded
  useEffect(() => {
    if (!loading && gamePhase === 'round' && !roundCard) {
      startNewRound();
    }
  }, [loading, gamePhase, roundCard, startNewRound]);
  // Cleanup timer when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Pause timer when leaving the game page (preserves time but stops execution)
      pauseTimer();
    };
  }, [pauseTimer]);

  // Function to handle card placement
  const onPlaceCard = async (cardId, position) => {
    stopTimer();
    await handlePlaceCard(cardId, position);
  };
  // Function to start a new round
  const onContinue = async () => {
    resetTimer(); // Reset timer when starting new round
    await startNewRound();
  };

  // Function to start a new game
  const onNewGame = async () => {
    try {
      // Clear timer data for current game before starting new one
      if (gameId) {
        clearTimerFromLocalStorage(gameId);
      }
      const result = await createGame();
      if (result && result.game) {
        navigate(`/game/${result.game.id}`);
      }
    } catch (error) {
      console.error('Failed to create new game:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-3">Caricamento del gioco...</p>
        </div>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Errore</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Torna alla Home
          </Button>
        </Alert>
      </Container>
    );
  }

  // Render game based on the current phase
  return (
    <Container className="game-container">
      {/* Game content based on phase */}
      {gamePhase === 'round' && (
        <GameRound
          roundCard={roundCard}
          cards={cards}
          onPlaceCard={onPlaceCard}
          timeLeft={timeLeft}
          incorrectAttempts={incorrectAttempts}
        />
      )}      {gamePhase === 'result' && (
        <GameResult
          result={roundResult}
          card={roundCard}
          cards={cards}
          onContinue={onContinue}
          timeLeft={timeLeft}
          incorrectAttempts={incorrectAttempts}
        />
      )}{gamePhase === 'over' && (
        <GameOver
          game={game}
          cards={cards}
          incorrectAttempts={incorrectAttempts}
          onNewGame={onNewGame}
        />      )}      {/* Cards collection (hand) - mostrato solo nella fase di risultato, non in GameOver */}
      {gamePhase === 'result' && (
        <CardHand 
          cards={cards} 
          showIndex={roundResult && roundResult.result === 'incorrect'} 
        />
      )}

      {/* Demo game modal */}
      <Modal 
        show={showDemoModal} 
        onHide={() => setShowDemoModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>Partita Demo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Stai giocando una partita demo senza effettuare il login. Il progresso non verrà salvato nel tuo profilo.</p>
          <p>Accedi per:</p>
          <ul>
            <li>Salvare le tue partite</li>
            <li>Visualizzare la cronologia</li>
            <li>Competere con altri giocatori</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDemoModal(false)}>
            Continua la partita demo
          </Button>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Accedi
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GamePage;
