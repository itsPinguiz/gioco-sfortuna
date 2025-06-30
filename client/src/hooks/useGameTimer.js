import { useState, useEffect, useRef } from 'react';

// ==========================================
// CONSTANTS
// ==========================================

const STORAGE_PREFIX = 'gameTimer_';
const TIMER_INTERVAL = 1000; // 1 second

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Saves timer state to localStorage with timestamp
 * @param {string} gameId - Game identifier
 * @param {number} timeLeft - Remaining time in seconds
 * @param {boolean} isRunning - Whether timer is currently running
 */
const saveTimerToLocalStorage = (gameId, timeLeft, isRunning) => {
  if (!gameId) return;
  
  try {
    const timerData = {
      timeLeft,
      isRunning,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_PREFIX + gameId, JSON.stringify(timerData));
  } catch (error) {
    console.warn('Failed to save timer to localStorage:', error);
  }
};

/**
 * Loads timer state from localStorage and adjusts for elapsed time
 * @param {string} gameId - Game identifier
 * @returns {Object|null} Timer state or null if not found
 */
const loadTimerFromLocalStorage = (gameId) => {
  if (!gameId) return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + gameId);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    
    // Calculate elapsed time since save
    const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
    const adjustedTime = Math.max(0, data.timeLeft - elapsed);
    
    return {
      timeLeft: adjustedTime,
      isRunning: data.isRunning && adjustedTime > 0
    };
  } catch (error) {
    console.warn('Error parsing saved timer data:', error);
    return null;
  }
};

/**
 * Clears timer data from localStorage
 * @param {string} gameId - Game identifier
 */
const clearTimerFromLocalStorage = (gameId) => {
  if (gameId) {
    localStorage.removeItem(STORAGE_PREFIX + gameId);
  }
};

// ==========================================
// MAIN HOOK
// ==========================================

/**
 * Custom hook to manage a countdown timer with localStorage persistence
 * 
 * Features:
 * - Countdown timer with configurable initial time
 * - localStorage persistence across page reloads
 * - Automatic time adjustment for elapsed time during page absence
 * - Start, stop, pause, and reset functionality
 * - Callback when timer reaches zero
 * 
 * @param {number} initialTime - Initial time in seconds (default: 30)
 * @param {Function} onTimeUp - Callback function when timer reaches zero
 * @param {string} gameId - Game ID for localStorage persistence
 * @returns {Object} Timer state and control functions
 */
const useGameTimer = (initialTime = 30, onTimeUp, gameId) => {
  // ==========================================
  // STATE INITIALIZATION
  // ==========================================
  
  // Try to load saved state first
  const savedState = gameId ? loadTimerFromLocalStorage(gameId) : null;
  
  const [timeLeft, setTimeLeft] = useState(
    savedState ? savedState.timeLeft : initialTime
  );
  const [isRunning, setIsRunning] = useState(
    savedState ? savedState.isRunning : false
  );
  
  const timerRef = useRef(null);

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Save timer state to localStorage when it changes
   */
  useEffect(() => {
    if (gameId) {
      saveTimerToLocalStorage(gameId, timeLeft, isRunning);
    }
  }, [timeLeft, isRunning, gameId]);

  /**
   * Handle saved state restoration on mount
   * Reset isRunning to prevent auto-restart after page reload
   */
  useEffect(() => {
    if (savedState?.isRunning && savedState.timeLeft > 0) {
      // Timer was running when page was reloaded
      // Reset running state - will be restarted explicitly by GamePage if needed
      setIsRunning(false);
      setTimeLeft(savedState.timeLeft);
    }
  }, []); // Only on mount

  // ==========================================
  // TIMER CONTROL FUNCTIONS
  // ==========================================
  
  /**
   * Starts or resumes the timer
   * Resets time to initial value if timer was at zero
   */
  const startTimer = () => {
    // Don't restart if timer is already running
    if (isRunning && timerRef.current) {
      return;
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset time if timer was at zero (fresh start)
    if (timeLeft <= 0) {
      setTimeLeft(initialTime);
    }
    
    setIsRunning(true);
    
    // Start the countdown interval
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          // Timer reached zero
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          
          // Trigger callback if provided
          if (onTimeUp) {
            onTimeUp();
          }
          
          return 0;
        }
        return prevTime - 1;
      });
    }, TIMER_INTERVAL);
  };

  /**
   * Stops the timer completely
   */
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  /**
   * Pauses the timer (stops but keeps current time)
   * Used when navigating away from the game
   */
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

  /**
   * Resets the timer to initial time and stops it
   */
  const resetTimer = () => {
    stopTimer();
    setTimeLeft(initialTime);
    
    // Clear from localStorage when resetting
    if (gameId) {
      clearTimerFromLocalStorage(gameId);
    }
  };

  // ==========================================
  // RETURN API
  // ==========================================
  
  return {
    // State
    timeLeft,
    isRunning,
    
    // Control functions
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    
    // Utility functions
    clearTimerFromLocalStorage: () => clearTimerFromLocalStorage(gameId)
};
};

export default useGameTimer;
