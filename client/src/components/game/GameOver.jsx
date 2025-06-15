import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import CardHand from './CardHand';
import styles from './GameOver.module.css';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Formats a date object to a localized date string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

/**
 * Formats a date object to a localized time string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time string
 */
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString();
};

/**
 * Calculates and formats game duration
 * @param {Date|string} startDate - Game start date
 * @param {Date|string|null} endDate - Game end date
 * @returns {string} Formatted duration string
 */
const calculateGameDuration = (startDate, endDate) => {
  const startTime = new Date(startDate).getTime();
  const endTime = endDate ? new Date(endDate).getTime() : Date.now();
  
  const durationMs = Math.max(0, endTime - startTime);
  const totalSeconds = Math.floor(durationMs / 1000);
  
  // Validation for unrealistic durations (more than 2 hours)
  if (totalSeconds > 7200 || totalSeconds < 0) {
    console.warn('Invalid game duration detected:', durationMs, 'ms');
    return 'N/A';
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format duration based on length
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Gets the appropriate title and styling for game result
 * @param {boolean} isWon - Whether the game was won
 * @returns {Object} Title configuration
 */
const getGameResultConfig = (isWon) => ({
  title: isWon ? '🏆 Hai Vinto!' : '😢 Hai Perso!',
  className: isWon ? styles.winTitle : styles.loseTitle,
  resultText: isWon ? 'Vittoria' : 'Sconfitta'
});

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Statistics item component for cleaner rendering
 */
const StatItem = ({ label, value }) => (
  <div className={styles.statItem}>
    <span className={styles.statLabel}>{label}:</span>
    <span className={styles.statValue}>{value}</span>
  </div>
);

/**
 * Game statistics section component
 */
const GameStats = ({ game, cards, incorrectAttempts, resultConfig }) => (
  <div className={styles.gameStats}>
    <h3>Statistiche Partita</h3>
    <div className={styles.statsGrid}>
      <StatItem 
        label="Data" 
        value={formatDate(game.start_date)} 
      />
      <StatItem 
        label="Ora" 
        value={formatTime(game.start_date)} 
      />
      <StatItem 
        label="Durata" 
        value={calculateGameDuration(game.start_date, game.end_date)} 
      />
      <StatItem 
        label="Carte raccolte" 
        value={cards.length} 
      />
      <StatItem 
        label="Errori" 
        value={`${incorrectAttempts !== undefined ? incorrectAttempts : game.incorrect_attempts}/3`} 
      />
      <StatItem 
        label="Risultato" 
        value={resultConfig.resultText} 
      />
    </div>
  </div>
);

/**
 * Action buttons section component
 */
const GameOverActions = ({ onNewGame }) => (
  <div className={styles.gameOverActions}>
    <Button 
      variant="primary" 
      size="lg"
      onClick={onNewGame}
      className={styles.actionButton}
    >
      Nuova Partita
    </Button>
    <Button 
      variant="outline-secondary" 
      size="lg"
      as={Link}
      to="/"
      className={styles.actionButton}
    >
      Torna alla Home
    </Button>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GameOver Component
 * Displays the game over screen with statistics, final card collection,
 * and options to start a new game or return to home
 * 
 * @param {Object} game - Game object containing result and timing info
 * @param {Array} cards - Array of cards collected during the game
 * @param {number} incorrectAttempts - Number of incorrect attempts made
 * @param {Function} onNewGame - Callback to start a new game
 */
const GameOver = ({ 
  game, 
  cards = [],
  incorrectAttempts,
  onNewGame
}) => {
  const navigate = useNavigate();
  
  // ==========================================
  // VALIDATION
  // ==========================================
  
  // Early return if game data is not available
  if (!game) {
    return null;
  }
  
  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  const isWon = game.result === 'won';
  const resultConfig = getGameResultConfig(isWon);
  
  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <Container className={styles.gameOverContainer}>
      {/* Header section with game result */}
      <div className={styles.gameOverHeader}>
        <h2 className={resultConfig.className}>
          {resultConfig.title}
        </h2>
      </div>
      
      {/* Main content section */}
      <div className={styles.gameOverContent}>
        {/* Game statistics */}
        <GameStats 
          game={game}
          cards={cards}
          incorrectAttempts={incorrectAttempts}
          resultConfig={resultConfig}
        />
        
        {/* Cards collection display */}
        {cards.length > 0 && (
          <div className={styles.cardsCollection}>
            <CardHand cards={cards} />
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <GameOverActions onNewGame={onNewGame} />
    </Container>
  );
};

export default GameOver;
