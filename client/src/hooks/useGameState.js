// Game state management hook
import { useState, useEffect, useRef } from 'react';
import { getGameById, getNextRoundCard, submitCardPlacement } from '../api/API';

/**
 * Custom hook that manages the game state
 * Handles loading the game, updating cards, and tracking attempts
 */
const useGameState = (gameId) => {
  // Game state
  const [game, setGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Round state
  const [roundCard, setRoundCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('loading'); // loading, round, result, over
  const [roundResult, setRoundResult] = useState(null);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  
  // Ref per evitare problemi di closure con lo stato degli errori
  const attemptsRef = useRef(incorrectAttempts);

  // Manteniamo aggiornata la ref ogni volta che lo stato cambia
  useEffect(() => {
    attemptsRef.current = incorrectAttempts;
  }, [incorrectAttempts]);

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
      console.log(`🃏 Placing card ${cardId} at position ${position}`);
      
      // Submit the placement
      const result = await submitCardPlacement(gameId, cardId, position);
      console.log('📥 Placement result:', result);
      
      // Update cards if placement was correct
      if (result.result === 'correct') {
        console.log('✅ Correct placement - adding card to collection');
        setCards(prev => [...prev, result.card]);
      } 
      
      // Usa SEMPRE il conteggio degli errori dal server
      if (result.incorrectAttempts !== undefined) {
        console.log('🔄 Using server error count:', result.incorrectAttempts);
        setIncorrectAttempts(result.incorrectAttempts);
        attemptsRef.current = result.incorrectAttempts;
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

      return result;
    } catch (error) {
      console.error('Error submitting card placement:', error);
      setError('Errore nell\'inserimento della carta. Riprova più tardi.');
      return null;
    }
  };
  const handleTimeUp = async () => {
    if (!roundCard || !roundCard.id) {
      console.warn('❌ Cannot handle timeout: roundCard is not available');
      return null;
    }
    
    try {
      console.log('⏰ TIMEOUT: Timer scaduto');
        // Per il timeout, usiamo la posizione -1 per indicare al server che è un timeout
      console.log('📤 Sending timeout to server with position=-1');
      const result = await submitCardPlacement(gameId, roundCard.id, -1);
      console.log('📥 Server response for timeout:', result);
      
      // Aggiorna sempre con il valore dal server
      if (result.incorrectAttempts !== undefined) {
        console.log('🔄 Using server error count:', result.incorrectAttempts);
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
        console.log('🏁 Game over per decisione del server');
        setTimeout(() => setGamePhase('over'), 50);
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
        setTimeout(() => setGamePhase('over'), 50);
      } else {
        setGamePhase('result');
      }
      
      return fakeResult;
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
