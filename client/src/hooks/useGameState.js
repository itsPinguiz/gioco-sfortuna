// Game state management hook
import { useState, useEffect, useRef } from 'react';
import { getGameById, getNextRoundCard, submitCardPlacement } from '../api/API';

/**
 * Custom hook that manages the game state
 * Handles loading the game, updating cards, and tracking attempts
 */
const useGameState = (gameId) => {
  // Helper functions for localStorage persistence
  const saveGameStateToLocalStorage = (gameId, roundCard, gamePhase, incorrectAttempts) => {
    if (gameId) {
      localStorage.setItem('gameState_' + gameId, JSON.stringify({
        roundCard,
        gamePhase,
        incorrectAttempts,
        timestamp: Date.now()
      }));
    }
  };

  const loadGameStateFromLocalStorage = (gameId) => {
    if (gameId) {
      const saved = localStorage.getItem('gameState_' + gameId);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Error parsing saved game state:', e);
        }
      }
    }
    return null;
  };

  const clearGameStateFromLocalStorage = (gameId) => {
    if (gameId) {
      localStorage.removeItem('gameState_' + gameId);
    }
  };

  // Initialize state - try to load from localStorage first
  const savedState = loadGameStateFromLocalStorage(gameId);
  
  // Game state
  const [game, setGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Round state - use saved state if available
  const [roundCard, setRoundCard] = useState(savedState ? savedState.roundCard : null);
  const [gamePhase, setGamePhase] = useState(savedState ? savedState.gamePhase : 'loading');
  const [roundResult, setRoundResult] = useState(null);
  const [incorrectAttempts, setIncorrectAttempts] = useState(savedState ? savedState.incorrectAttempts : 0);
  
  // Ref per evitare problemi di closure con lo stato degli errori
  const attemptsRef = useRef(incorrectAttempts);
  // Manteniamo aggiornata la ref ogni volta che lo stato cambia
  useEffect(() => {
    attemptsRef.current = incorrectAttempts;
  }, [incorrectAttempts]);

  // Save game state to localStorage when it changes
  useEffect(() => {
    if (gameId && gamePhase !== 'loading') {
      saveGameStateToLocalStorage(gameId, roundCard, gamePhase, incorrectAttempts);
    }
  }, [gameId, roundCard, gamePhase, incorrectAttempts]);

  // Load game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameById(gameId);
        if (data.game) {
          setGame(data.game);
          setCards(data.cards || []);
          // Utilizziamo SEMPRE il conteggio dal server
          if (data.game.incorrect_attempts !== undefined) {
            setIncorrectAttempts(data.game.incorrect_attempts);
            attemptsRef.current = data.game.incorrect_attempts;
          }
          setGamePhase(data.game.result ? 'over' : 'round');
        } else {
          setError('Gioco non trovato.');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Errore nel caricamento del gioco. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Load a new round card
  const loadRoundCard = async () => {
    try {
      setGamePhase('loading');
      const card = await getNextRoundCard(gameId);
      setRoundCard(card);
      setGamePhase('round');
      return card;
    } catch (error) {
      console.error('Error loading round card:', error);
      setError('Errore nel caricamento della carta. Riprova più tardi.');
      return null;
    }
  };

  // Submit card placement
  const handlePlaceCard = async (cardId, position) => {
    try {
      // Submit the placement
      const result = await submitCardPlacement(gameId, cardId, position);
      // Update cards if placement was correct
      if (result.result === 'correct') {
        setCards(prev => [...prev, result.card]);
      } 
      
      // Usa il conteggio degli errori dal server
      if (result.incorrectAttempts !== undefined) {
        setIncorrectAttempts(result.incorrectAttempts);
        attemptsRef.current = result.incorrectAttempts;
      }
      
      // Aggiorniamo lo stato del risultato del round
      setRoundResult(result);
        // Aggiorniamo la fase del gioco
      if (result.gameCompleted) {
        // Ricarica i dati del gioco dal database per avere end_date aggiornato
        setTimeout(async () => {
          try {
            const updatedGameData = await getGameById(gameId);
            if (updatedGameData.game) {
              setGame(updatedGameData.game);
            }
          } catch (error) {
            console.error('Error reloading game data:', error);
          }
          setGamePhase('over');
        }, 100); // Piccolo delay per permettere al server di salvare
      } else {
        setGamePhase('result');
      }

      return result;
    } catch (error) {
      console.error('Error submitting card placement:', error);
      setError('Errore nell\'inserimento della carta. Riprova più tardi.');
      return null;
    }
  };
  // Add ref to track if timeout is already being processed
  const timeoutProcessingRef = useRef(false);
  
  // Reset timeout processing flag when new round starts
  useEffect(() => {
    if (roundCard?.id) {
      timeoutProcessingRef.current = false;
    }
  }, [roundCard?.id]);

  const handleTimeUp = async () => {
    // Prevent multiple timeout submissions for the same round
    if (timeoutProcessingRef.current) {
      return null;
    }
    
    if (!roundCard || !roundCard.id) {
      return null;
    }
    
    try {
      timeoutProcessingRef.current = true; // Mark as processing
      
      // Per il timeout, usiamo la posizione -1 per indicare al server che è un timeout
      const result = await submitCardPlacement(gameId, roundCard.id, -1);
      // Aggiorna sempre con il valore dal server
      if (result.incorrectAttempts !== undefined) {
        setIncorrectAttempts(result.incorrectAttempts);
        attemptsRef.current = result.incorrectAttempts;
      }
      
      // Aggiorniamo il risultato per la visualizzazione
      setRoundResult({
        ...result,
        result: 'incorrect',
        correctPosition: result.correctPosition || 0
      });
        // Gestiamo il fine partita basandoci sul server
      if (result.gameCompleted) {
        // Ricarica i dati del gioco dal database per avere end_date aggiornato
        setTimeout(async () => {
          try {
            const updatedGameData = await getGameById(gameId);
            if (updatedGameData.game) {
              setGame(updatedGameData.game);
            }
          } catch (error) {
            console.error('Error reloading game data:', error);
          }
          setGamePhase('over');
        }, 100); // Piccolo delay per permettere al server di salvare
      } else {
        setGamePhase('result');
      }
      
      return result;
    } catch (error) {
      console.error('Error handling timeout:', error);
      
      // In caso di errore di rete, incrementiamo manualmente gli errori
      // e mostriamo comunque un risultato
      const newAttempts = attemptsRef.current + 1;
      setIncorrectAttempts(newAttempts);
      attemptsRef.current = newAttempts;
      
      // Creiamo un risultato artificiale per non bloccare il gioco
      const fakeResult = {
        result: 'incorrect',
        correctPosition: 0,
        incorrectAttempts: newAttempts,
        gameCompleted: newAttempts >= 3
      };
        setRoundResult(fakeResult);
      
      if (newAttempts >= 3) {
        // Anche qui, prova a ricaricare i dati del gioco se possibile
        setTimeout(async () => {
          try {
            const updatedGameData = await getGameById(gameId);
            if (updatedGameData.game && updatedGameData.game.end_date) {
              setGame(updatedGameData.game);
            }
          } catch (error) {
            console.error('Error reloading game data after manual timeout:', error);
          }
          setGamePhase('over');
        }, 100);
      } else {
        setGamePhase('result');
      }
      
      return fakeResult;
    } finally {
      // Keep the flag set to prevent duplicate submissions for this round
      // It will be reset when a new round starts
    }
  };
  
  // Start a new round
  const startNewRound = async () => {
    setRoundResult(null);
    return await loadRoundCard();
  };

  return {
    game,
    cards,
    loading,
    error,
    roundCard,
    gamePhase,
    roundResult,
    incorrectAttempts,
    attemptsRef,
    setGamePhase,
    handlePlaceCard,
    handleTimeUp,
    startNewRound,
    loadRoundCard
  };
};

export default useGameState;
