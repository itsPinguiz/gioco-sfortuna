// Timer hook for game rounds
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage a countdown timer with localStorage persistence
 * @param {number} initialTime - Initial time in seconds
 * @param {function} onTimeUp - Function to call when time is up
 * @param {string} gameId - Game ID for localStorage persistence
 * @returns {Object} - Timer state and control functions
 */
const useGameTimer = (initialTime = 30, onTimeUp, gameId) => {
  // Helper functions for localStorage
  const saveTimerToLocalStorage = (gameId, timeLeft, isRunning) => {
    if (gameId) {
      localStorage.setItem('gameTimer_' + gameId, JSON.stringify({
        timeLeft,
        isRunning,
        timestamp: Date.now()
      }));
    }
  };

  const loadTimerFromLocalStorage = (gameId) => {
    if (gameId) {
      const saved = localStorage.getItem('gameTimer_' + gameId);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          // Calcola il tempo trascorso da quando è stato salvato
          const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
          const adjustedTime = Math.max(0, data.timeLeft - elapsed);
          
          return {
            timeLeft: adjustedTime,
            isRunning: data.isRunning && adjustedTime > 0
          };
        } catch (e) {
          console.warn('Error parsing saved timer data:', e);
        }
      }
    }
    return null;
  };

  const clearTimerFromLocalStorage = (gameId) => {
    if (gameId) {
      localStorage.removeItem('gameTimer_' + gameId);
    }
  };

  // Initialize state - try to load from localStorage first
  const savedState = gameId ? loadTimerFromLocalStorage(gameId) : null;
  const [timeLeft, setTimeLeft] = useState(savedState ? savedState.timeLeft : initialTime);
  const [isRunning, setIsRunning] = useState(savedState ? savedState.isRunning : false);
  const timerRef = useRef(null);
  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Save timer state to localStorage when it changes
  useEffect(() => {
    if (gameId) {
      saveTimerToLocalStorage(gameId, timeLeft, isRunning);
    }
  }, [timeLeft, isRunning, gameId]);  // Restore running timer on mount if it was running
  useEffect(() => {
    if (savedState && savedState.isRunning && savedState.timeLeft > 0) {
      // Il timer era in esecuzione quando la pagina è stata ricaricata
      // IMPORTANTE: Non riavviamo automaticamente il timer
      // Verrà riavviato esplicitamente dalla GamePage se necessario
      setIsRunning(false); // Resetta lo stato isRunning
      setTimeLeft(savedState.timeLeft); // Mantieni il tempo rimanente
    }
  }, []); // Solo al mount
  // Start the timer
  const startTimer = () => {
    // Don't restart if timer is already running
    if (isRunning && timerRef.current) {
      return;
    }
    
    // First clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset time - only if timer is at 0 or this is a fresh start
    if (timeLeft <= 0) {
      setTimeLeft(initialTime);
    }
    
    setIsRunning(true);
    
    // Start the interval
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          // Time's up
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  // Stop the timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  // Pause the timer (stop but keep time) - used when navigating away
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    // Save current state as paused to localStorage
    if (gameId) {
      saveTimerToLocalStorage(gameId, timeLeft, false);
    }
  };
  // Reset the timer
  const resetTimer = () => {
    stopTimer();
    setTimeLeft(initialTime);
    // Clear from localStorage when resetting
    if (gameId) {
      clearTimerFromLocalStorage(gameId);
    }
  };
  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    clearTimerFromLocalStorage
  };
};

export default useGameTimer;
