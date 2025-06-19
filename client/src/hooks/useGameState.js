import { useState, useEffect, useRef } from 'react';
import { getGameById, getNextRoundCard, submitCardPlacement } from '../api/API';

// ==========================================
// CONSTANTS
// ==========================================

const STORAGE_PREFIX = 'gameState_';
const MAX_ATTEMPTS = 3;
const TIMEOUT_POSITION = -1; // Special position value for timeout submissions
const GAME_RELOAD_DELAY = 100; // Delay for server data sync

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Saves game state to localStorage
 * @param {string} gameId - Game identifier
 * @param {Object} roundCard - Current round card
 * @param {string} gamePhase - Current game phase
 * @param {number} incorrectAttempts - Number of incorrect attempts
 */
const saveGameStateToLocalStorage = (gameId, roundCard, gamePhase, incorrectAttempts) => {
  if (!gameId) return;
  
  try {
    const gameStateData = {
      roundCard,
      gamePhase,
      incorrectAttempts,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_PREFIX + gameId, JSON.stringify(gameStateData));
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error);
  }
};

/**
 * Loads game state from localStorage
 * @param {string} gameId - Game identifier
 * @returns {Object|null} Game state or null if not found
 */
const loadGameStateFromLocalStorage = (gameId) => {
  if (!gameId) return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + gameId);
    if (!saved) return null;
    
    return JSON.parse(saved);
  } catch (error) {
    console.warn('Error parsing saved game state:', error);
    return null;
  }
};

/**
 * Clears game state from localStorage
 * @param {string} gameId - Game identifier
 */
const clearGameStateFromLocalStorage = (gameId) => {
  if (gameId) {
    localStorage.removeItem(STORAGE_PREFIX + gameId);
  }
};

/**
 * Creates a fallback result object for error scenarios
 * @param {number} attempts - Current number of attempts
 * @returns {Object} Fallback result object
 */
const createFallbackResult = (attempts) => ({
  result: 'incorrect',
  correctPosition: 0,
  incorrectAttempts: attempts,
  gameCompleted: attempts >= MAX_ATTEMPTS
});

/**
 * Reloads game data from server with error handling
 * @param {string} gameId - Game identifier
 * @param {Function} setGame - Game state setter
 * @param {Function} setRounds - Rounds state setter
 */
const reloadGameData = async (gameId, setGame, setRounds) => {
  try {
    console.log('Reloading game data for rounds...');
    const updatedGameData = await getGameById(gameId);
    console.log('Reloaded game data:', updatedGameData);
    
    if (updatedGameData.game) {
      setGame(updatedGameData.game);
    }
    if (updatedGameData.rounds) {
      console.log('Setting rounds from reloaded data:', updatedGameData.rounds);
      setRounds(updatedGameData.rounds);
    }
  } catch (error) {
    console.error('Error reloading game data:', error);
  }
};

// ==========================================
// MAIN HOOK
// ==========================================

/**
 * Custom hook that manages comprehensive game state
 * 
 * Features:
 * - Game data loading and management
 * - Round state management with localStorage persistence
 * - Card placement handling
 * - Timeout handling with fallback mechanisms
 * - Attempt tracking with server synchronization
 * - Game phase transitions
 * 
 * @param {string} gameId - Game identifier
 * @returns {Object} Game state and control functions
 */
const useGameState = (gameId) => {
  // ==========================================
  // STATE INITIALIZATION
  // ==========================================
  
  // Load saved state if available
  const savedState = loadGameStateFromLocalStorage(gameId);
  
  // Core game state
  const [game, setGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Round state - use saved state if available
  const [roundCard, setRoundCard] = useState(savedState?.roundCard || null);
  const [gamePhase, setGamePhase] = useState(savedState?.gamePhase || 'loading');
  const [roundResult, setRoundResult] = useState(null);
  const [incorrectAttempts, setIncorrectAttempts] = useState(savedState?.incorrectAttempts || 0);
  
  // Refs for avoiding closure issues
  const attemptsRef = useRef(incorrectAttempts);
  const timeoutProcessingRef = useRef(false);

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Keep attempts ref synchronized with state
   */
  useEffect(() => {
    attemptsRef.current = incorrectAttempts;
  }, [incorrectAttempts]);

  /**
   * Save game state to localStorage when it changes
   */
  useEffect(() => {
    if (gameId && gamePhase !== 'loading') {
      saveGameStateToLocalStorage(gameId, roundCard, gamePhase, incorrectAttempts);
    }
  }, [gameId, roundCard, gamePhase, incorrectAttempts]);

  /**
   * Load initial game data
   */
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameById(gameId);
        
        console.log('Fetched game data:', data); // Debug log
        
        if (data.game) {
          setGame(data.game);
          setCards(data.cards || []);
          setRounds(data.rounds || []);
          
          console.log('Set rounds:', data.rounds); // Debug log
          
          // Always use server's attempt count as source of truth
          if (data.game.incorrect_attempts !== undefined) {
            setIncorrectAttempts(data.game.incorrect_attempts);
            attemptsRef.current = data.game.incorrect_attempts;
          }
          
          // Set appropriate game phase
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

  /**
   * Reset timeout processing flag when new round starts
   */
  useEffect(() => {
    if (roundCard?.id) {
      timeoutProcessingRef.current = false;
    }
  }, [roundCard?.id]);

  // ==========================================
  // GAME CONTROL FUNCTIONS
  // ==========================================
  
  /**
   * Loads a new round card from the server
   * @returns {Object|null} The loaded card or null on error
   */
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

  /**
   * Handles card placement submission
   * @param {string} cardId - ID of the card being placed
   * @param {number} position - Position where card is being placed
   * @returns {Object|null} Placement result or null on error
   */  const handlePlaceCard = async (cardId, position) => {
    try {
      const result = await submitCardPlacement(gameId, cardId, position);
      
      // Update the round card with the complete data including misfortune_index
      if (result.card) {
        setRoundCard(result.card);
      }
      
      // Update cards collection if placement was correct
      if (result.result === 'correct') {
        setCards(prev => [...prev, result.card]);
      }
      
      // Always use server's attempt count
      if (result.incorrectAttempts !== undefined) {
        setIncorrectAttempts(result.incorrectAttempts);
        attemptsRef.current = result.incorrectAttempts;
      }
      
      // Update round result for display
      setRoundResult(result);
      
      // Handle game completion (including guest games)
      if (result.gameCompleted) {
        // Reload game data after small delay for server sync
        setTimeout(async () => {
          await reloadGameData(gameId, setGame, setRounds);
          setGamePhase('over');
        }, GAME_RELOAD_DELAY);
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

  /**
   * Handles timeout scenarios with fallback mechanisms
   * @returns {Object|null} Timeout result or null if already processing
   */
  const handleTimeUp = async () => {
    // Prevent duplicate timeout processing
    if (timeoutProcessingRef.current || !roundCard?.id) {
      return null;
    }
    
    try {
      timeoutProcessingRef.current = true;
        // Submit timeout with special position indicator
      const result = await submitCardPlacement(gameId, roundCard.id, TIMEOUT_POSITION);
      
      // Update the round card with the complete data including misfortune_index
      // This ensures the index is shown in the result phase after timeout
      if (result.card) {
        setRoundCard(result.card);
      }
      
      // Update attempts with server data
      if (result.incorrectAttempts !== undefined) {
        setIncorrectAttempts(result.incorrectAttempts);
        attemptsRef.current = result.incorrectAttempts;
      }
      
      // Set result for display
      setRoundResult({
        ...result,
        result: 'incorrect',
        correctPosition: result.correctPosition || 0
      });
      
      // Handle game completion
      if (result.gameCompleted) {
        setTimeout(async () => {
          await reloadGameData(gameId, setGame, setRounds);
          setGamePhase('over');
        }, GAME_RELOAD_DELAY);
      } else {
        setGamePhase('result');
      }
      
      return result;
    } catch (error) {
      console.error('Error handling timeout:', error);
      
      // Fallback mechanism for network errors
      const newAttempts = attemptsRef.current + 1;
      setIncorrectAttempts(newAttempts);
      attemptsRef.current = newAttempts;
      
      const fallbackResult = createFallbackResult(newAttempts);
      setRoundResult(fallbackResult);
      
      // Handle potential game end
      if (newAttempts >= MAX_ATTEMPTS) {
        setTimeout(async () => {
          await reloadGameData(gameId, setGame, setRounds);
          setGamePhase('over');
        }, GAME_RELOAD_DELAY);
      } else {
        setGamePhase('result');
      }
      
      return fallbackResult;
    }
    // Note: timeoutProcessingRef.current remains true until new round starts
  };

  /**
   * Starts a new round by clearing result and loading new card
   * @returns {Object|null} New round card or null on error
   */
  const startNewRound = async () => {
    setRoundResult(null);
    return await loadRoundCard();
  };

  // ==========================================
  // RETURN API
  // ==========================================
  
  return {
    // Game state
    game,
    cards,
    rounds,
    loading,
    error,
    
    // Round state
    roundCard,
    gamePhase,
    roundResult,
    incorrectAttempts,
    
    // Refs
    attemptsRef,
    
    // Control functions
    setGamePhase,
    handlePlaceCard,
    handleTimeUp,
    startNewRound,
    loadRoundCard
  };
};

export default useGameState;
