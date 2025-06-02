// Timer hook for game rounds
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage a countdown timer
 * @param {number} initialTime - Initial time in seconds
 * @param {function} onTimeUp - Function to call when time is up
 * @returns {Object} - Timer state and control functions
 */
const useGameTimer = (initialTime = 30, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
    
    // Reset time - only if not already running
    if (!isRunning) {
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

  // Reset the timer
  const resetTimer = () => {
    stopTimer();
    setTimeLeft(initialTime);
  };

  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
    timerRef
  };
};

export default useGameTimer;
