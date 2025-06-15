import React from 'react';
import { Container, Button } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameResult.module.css';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Determines the display text and styling based on result type
 * @param {boolean} isCorrect - Whether the result is correct
 * @returns {Object} Button configuration object
 */
const getButtonConfig = (isCorrect) => ({
  variant: isCorrect ? 'success' : 'primary',
  text: isCorrect ? 'Continua' : 'Prossima carta'
});

/**
 * Validates the required props for the component
 * @param {Object} result - The result object
 * @param {Object} card - The card object
 * @returns {boolean} Whether props are valid
 */
const validateProps = (result, card) => {
  return result && card && result.result;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GameResult Component
 * Displays the result of a game round, showing whether the user's
 * card placement was correct or incorrect, along with game state info
 * 
 * @param {Object} result - Result object containing success/failure info
 * @param {Object} card - The card that was placed
 * @param {Array} cards - Array of all cards (for future use)
 * @param {Function} onContinue - Callback to continue to next round
 * @param {number} timeLeft - Remaining time in seconds
 * @param {number} incorrectAttempts - Number of incorrect attempts
 * @param {number} maxAttempts - Maximum allowed attempts
 */
const GameResult = ({ 
  result, 
  card, 
  cards = [],
  onContinue,
  timeLeft = 0,
  incorrectAttempts = 0,
  maxAttempts = 3
}) => {
  // ==========================================
  // VALIDATION
  // ==========================================
  
  // Early return if required props are missing
  if (!validateProps(result, card)) {
    return null;
  }

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  // Determine if the result is correct
  const isCorrect = result.result === 'correct';
  
  // Get button configuration based on result
  const buttonConfig = getButtonConfig(isCorrect);

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <Container className={styles.resultContainer}>
      {/* Header section - consistent with GameRound component */}
      <div className={styles.roundHeader}>
        {/* Attempts counter */}
        <div className={styles.attemptsCounter}>
          <span>Errori: {incorrectAttempts}/{maxAttempts}</span>
        </div>
        
        {/* Timer display */}
        <div className={styles.timer}>
          <div className={styles.timerLabel}>
            Tempo rimasto:
          </div>
          <div 
            className={`${styles.timerValue} ${timeLeft <= 10 ? styles.timerLow : ''}`}
          >
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Card result display */}
      <div className={styles.cardResult}>
        <MisfortuneCard 
          card={card} 
          showIndex={!isCorrect} // Show index only when incorrect for learning
          result={isCorrect ? 'correct' : 'incorrect'} 
        />
      </div>
      
      {/* Action buttons */}
      <div className={styles.actionButtons}>
        <Button
          variant={buttonConfig.variant}
          onClick={onContinue}
          className={styles.continueButton}
        >
          {buttonConfig.text}
        </Button>
      </div>
    </Container>
  );
};

export default GameResult;
