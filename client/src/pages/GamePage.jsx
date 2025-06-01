import { useState, useEffect, useContext, useRef } from 'react';
import { Container, Alert, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getGameById, getNextRoundCard, submitCardPlacement } from '../api/API';
import { CardHand, GameRound, GameResult, GameOver } from '../components/Card';
import './GamePage.css';

// Game page component
const GamePage = () => {
  const { gameId } = useParams();
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Game state
  const [game, setGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Round state
  const [roundCard, setRoundCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('loading'); // loading, round, result, over
  const [roundResult, setRoundResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const timerRef = useRef(null);
  // Ref per evitare problemi di closure con lo stato degli errori
  const attemptsRef = useRef(incorrectAttempts);

  // Manteniamo aggiornata la ref ogni volta che lo stato cambia
  useEffect(() => {
    attemptsRef.current = incorrectAttempts;
  }, [incorrectAttempts]);
  
  // Demo game modal
  const [showDemoModal, setShowDemoModal] = useState(!isAuthenticated);

  // Load game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameById(gameId);
          if (data.game) {
          setGame(data.game);
          setCards(data.cards || []);
          // Initialize incorrect attempts counter if available in the game data
          if (data.game.incorrect_attempts !== undefined) {
            setIncorrectAttempts(data.game.incorrect_attempts);
          }
        } else {
          setGame(data);
          setCards(data.cards || []);
          // Initialize incorrect attempts counter if available in the game data
          if (data.incorrect_attempts !== undefined) {
            setIncorrectAttempts(data.incorrect_attempts);
          }
        }
        
        // Check if game is already over
        if (data.game?.result || data.result) {
          setGamePhase('over');
        } else {
          // Start the first round
          startNewRound();
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Errore nel caricamento del gioco. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
    
    return () => {
      // Clear any timers when component unmounts
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameId]);  // Start a new round - versione migliorata e più robusta
  const startNewRound = async () => {
    try {
      console.log('🔄 Starting new round...');
      
      // Reset error state if there was any
      setError('');
      
      // Fermiamo subito qualsiasi timer esistente
      if (timerRef.current) {
        console.log('⏱️ Clearing previous timer');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log('📤 Fetching new card for game', gameId);
      // Get a new card for this round
      const card = await getNextRoundCard(gameId);
      console.log('📥 Received card:', card?.id || 'no card');
      
      // Verifichiamo che la carta sia stata caricata correttamente
      if (!card || !card.id) {
        throw new Error('Card not loaded correctly');
      }
      
      // Aggiorniamo lo stato con la nuova carta
      setRoundCard(card);
      setGamePhase('round');
      setTimeLeft(30);
      
      console.log('⏱️ Starting 30-second timer for card placement');
      
      // Piccolo ritardo per garantire che lo stato sia aggiornato
      setTimeout(() => {
        // Assicuriamoci che non ci siano timer esistenti
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Creiamo un nuovo timer
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            // Log periodici per debug
            if (prev === 30 || prev === 20 || prev === 10 || prev === 5 || prev <= 3) {
              console.log(`⏱️ Timer: ${prev} seconds remaining`);
            }
            
            if (prev <= 1) {
              // Quando il timer raggiunge 0, lo fermiamo e gestiamo il timeout
              console.log('⏱️ Timer expired - triggering timeout');
              clearInterval(timerRef.current);
              timerRef.current = null;
              
              // Chiamiamo handleTimeUp con un piccolo ritardo per evitare condizioni di race
              setTimeout(() => handleTimeUp(), 50);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 100);
    } catch (error) {
      console.error('❌ Error starting new round:', error);
      
      // In caso di errore critico, consideriamo la gravità
      if (incorrectAttempts >= 2) {
        // Se abbiamo già 2 errori, questo errore fa terminare il gioco
        console.log('🏁 Critical error with 2+ incorrect attempts - ending game');
        setIncorrectAttempts(prev => {
          const finalCount = prev + 1;
          setTimeout(() => setGamePhase('over'), 100);
          return finalCount;
        });
        alert('Errore critico. Non è possibile continuare la partita.');
      } else {
        // Altrimenti incrementiamo gli errori e proviamo a recuperare
        setIncorrectAttempts(prev => {
          console.log('⚠️ Error counted as incorrect attempt, new count:', prev + 1);
          return prev + 1;
        });
        setRoundCard(null);
        alert('Errore nel caricamento della carta. Contato come tentativo errato.');
        
        // Tentiamo di recuperare
        console.log('🔄 Attempting to recover in 2 seconds');
        setTimeout(() => {
          startNewRound();
        }, 2000);
      }
    }
  };// Handle time up - versione migliorata che garantisce il conteggio degli errori
  const handleTimeUp = async () => {
    try {
      console.log('⏰ TIMEOUT: Timer scaduto');
      console.log('📊 Current state before handling timeout:', {
        incorrectAttempts: attemptsRef.current,
        gamePhase,
        timeLeft,
        roundCardId: roundCard?.id
      });
      
      if (!roundCard || !roundCard.id) {
        console.warn('❌ Cannot handle timeout: roundCard is not available');
        // Riavvia automaticamente un nuovo round
        startNewRound();
        return;
      }
      
      // STEP 1: Incrementiamo IMMEDIATAMENTE il contatore degli errori localmente
      let newErrorCount = attemptsRef.current + 1;
      console.log('⚠️ TIMEOUT: Incrementing error count locally to', newErrorCount);
      
      setIncorrectAttempts(newErrorCount);
      attemptsRef.current = newErrorCount;
      
      // STEP 2: Comunichiamo al server per sincronizzare lo stato
      try {
        console.log('📤 Sending timeout to server with position=-1');
        const result = await submitCardPlacement(gameId, roundCard.id, -1);
        console.log('📥 Server response for timeout:', result);
        
        // Se il server ha restituito un conteggio degli errori, sincronizziamo
        if (result.incorrectAttempts !== undefined) {
          console.log('🔄 Synchronizing with server error count:', result.incorrectAttempts);
          if (result.incorrectAttempts > newErrorCount) {
            newErrorCount = result.incorrectAttempts;
            setIncorrectAttempts(newErrorCount);
            attemptsRef.current = newErrorCount;
            console.log('📊 Updated local error count to match server:', newErrorCount);
          }
        }
        
        // STEP 3: Aggiorniamo il risultato per la visualizzazione
        setRoundResult({
          ...result,
          result: 'incorrect',
          correctPosition: result.correctPosition || 0,
          incorrectAttempts: newErrorCount // Aggiungiamo sempre questo campo
        });
        
        // STEP 4: Gestiamo il fine partita se necessario
        // Se il server dice che la partita è finita o abbiamo raggiunto 3 errori
        if (result.gameCompleted || newErrorCount >= 3) {
          console.log('🏁 Game over due to timeout');
          setTimeout(() => setGamePhase('over'), 50);
        } else {
          setGamePhase('result');
        }
      } catch (serverError) {
        console.warn('❌ Server communication failed:', serverError);
        
        setRoundResult({
          result: 'incorrect',
          card: roundCard,
          gameCompleted: newErrorCount >= 3,
          correctPosition: 0,
          incorrectAttempts: newErrorCount
        });
        
        if (newErrorCount >= 3) {
          console.log('🏁 Game over due to timeout (local count)');
          setTimeout(() => setGamePhase('over'), 50);
        } else {
          setGamePhase('result');
        }
      }
    } catch (error) {
      console.error('❌ Fatal error in handleTimeUp:', error);
      
      const finalErrorCount = attemptsRef.current + 1;
      console.log('🚨 TIMEOUT (error recovery): Error count =', finalErrorCount);
      setIncorrectAttempts(finalErrorCount);
      attemptsRef.current = finalErrorCount;
      
      setRoundResult({
        result: 'incorrect',
        card: roundCard || { name: 'Carta non disponibile' },
        gameCompleted: finalErrorCount >= 3,
        correctPosition: 0,
        incorrectAttempts: finalErrorCount
      });
      
      if (finalErrorCount >= 3) {
        setTimeout(() => setGamePhase('over'), 50);
      } else {
        setGamePhase('result');
      }
    }
  };// Handle card placement - migliorato per gestire meglio gli errori
  const handlePlaceCard = async (cardId, position) => {
    try {
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log(`🃏 Placing card ${cardId} at position ${position}`);
      
      // Submit the placement
      const result = await submitCardPlacement(gameId, cardId, position);
      console.log('📥 Placement result:', result);
      
      // Update cards if placement was correct
      if (result.result === 'correct') {
        console.log('✅ Correct placement - adding card to collection');
        setCards(prev => [...prev, result.card]);
      } else {
        console.log('❌ Incorrect placement');
        
        let newErrorCount = attemptsRef.current + 1;
        
        if (result.incorrectAttempts !== undefined) {
          console.log('🔄 Server reported error count:', result.incorrectAttempts);
          newErrorCount = Math.max(newErrorCount, result.incorrectAttempts);
        } else {
          console.log('⚠️ No error count from server, using local count:', newErrorCount);
        }
        
        console.log('📊 Final error count:', newErrorCount);
        setIncorrectAttempts(newErrorCount);
        attemptsRef.current = newErrorCount;
        
        result.incorrectAttempts = newErrorCount;
        
        if (newErrorCount >= 3 && !result.gameCompleted) {
          console.log('🏁 Max attempts reached locally, marking game as completed');
          result.gameCompleted = true;
        }
      }
      
      // Aggiorniamo lo stato del risultato del round
      setRoundResult(result);
      
      // Aggiorniamo la fase del gioco
      if (result.gameCompleted) {
        console.log('🏁 Game is completed, setting phase to over');
        setTimeout(() => setGamePhase('over'), 50);
      } else {
        setGamePhase('result');
      }
    } catch (error) {
      console.error('❌ Error placing card:', error);
      
      const newErrorCount = attemptsRef.current + 1;
      console.log('⚠️ Network error, counting as incorrect attempt. New count:', newErrorCount);
      setIncorrectAttempts(newErrorCount);
      attemptsRef.current = newErrorCount;
      
      // Se abbiamo raggiunto il limite, terminiamo il gioco
      if (newErrorCount >= 3) {
        alert('Errore di connessione. Il limite di errori è stato raggiunto e la partita è terminata.');
        setTimeout(() => setGamePhase('over'), 50);
      } else {
        // Altrimenti mostriamo un errore e continuiamo
        alert('Si è verificato un errore di connessione. Conta come un tentativo errato.');
        
        // Creiamo un risultato locale per mostrare l'errore
        setRoundResult({
          result: 'incorrect',
          card: roundCard || { name: 'Errore di connessione' },
          correctPosition: 0,
          incorrectAttempts: newErrorCount
        });
        
        setGamePhase('result');
      }
    }
  };

  // Continue to the next round
  const handleContinue = () => {
    // For demo users, if they've played one round, redirect to login
    if (!isAuthenticated && roundResult) {
      navigate('/login', { 
        state: { message: 'Registrati per continuare a giocare!' } 
      });
      return;
    }
    
    // If game is not over, start a new round
    if (gamePhase !== 'over') {
      startNewRound();
    }
  };

  // Start a new game
  const handleNewGame = () => {
    navigate('/');
  };

  // Close the demo modal
  const handleCloseDemoModal = () => {
    setShowDemoModal(false);
  };

  // Show loading state
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3">Caricamento del gioco...</p>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button onClick={() => navigate('/')}>Torna alla Home</Button>
      </Container>
    );
  }
  // Render the game based on the current phase
  return (
    <Container className="mt-4">
      {/* Demo game modal for anonymous users */}
      <Modal show={showDemoModal} onHide={handleCloseDemoModal}>
        <Modal.Header closeButton>
          <Modal.Title>Partita Demo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Stai giocando una partita demo. Da utente anonimo, potrai giocare solo un round.</p>
          <p>Per accedere a tutte le funzionalità del gioco, effettua il login.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDemoModal}>
            Ho capito
          </Button>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Vai al Login
          </Button>
        </Modal.Footer>
      </Modal>
        <div className="d-flex">
        {/* Game info sidebar - migliorato con stili visivi */}
        <div className="me-3" style={{ width: '150px', position: 'sticky', top: '1rem' }}>
          <div className="p-3 bg-light rounded shadow-sm mb-3">
            <h5 className="mb-3 text-center">Info Partita</h5>
            <div className="mb-2">
              <strong>Carte:</strong> {cards.length}
            </div>
            <div className="mb-2" style={{ 
              fontWeight: incorrectAttempts >= 2 ? 'bold' : 'normal',
              color: incorrectAttempts >= 2 ? '#dc3545' : incorrectAttempts >= 1 ? '#fd7e14' : 'inherit'
            }}>
              <strong>Errori:</strong> <span className={incorrectAttempts > 0 ? "pulsate" : ""}>{incorrectAttempts}/3</span>
            </div>
            {gamePhase === 'round' && (
              <div className={`mb-2 ${timeLeft <= 5 ? 'countdown-danger' : timeLeft <= 10 ? 'countdown-warning' : ''}`}>
                <strong>Tempo:</strong> {timeLeft}s
              </div>
            )}
          </div>
        </div>

        {/* Main game content */}
        <div className="flex-grow-1">
        {/* Game phase content */}
      {(gamePhase === 'round' || gamePhase === 'result') && roundCard && (
        <GameRound 
          gameCards={cards} 
          roundCard={roundCard} 
          onPlaceCard={handlePlaceCard} 
          timeLeft={timeLeft}
          roundResult={gamePhase === 'result' ? roundResult : null}
          onContinue={handleContinue}
        />
      )}{gamePhase === 'over' && (
        <GameOver 
          won={cards.length >= 6}
          cards={cards}
          onNewGame={handleNewGame}
        />
      )}
        </div>
      </div>
    </Container>
  );
};

export default GamePage;
