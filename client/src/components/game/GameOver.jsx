import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import CardHand from './CardHand';
import styles from './GameOver.module.css';

/**
 * Component to display the game over screen
 */
const GameOver = ({ 
  game, 
  cards = [],
  incorrectAttempts,
  onNewGame
}) => {
  const navigate = useNavigate();
  
  if (!game) {
    return null;
  }
  
  const isWon = game.result === 'won';
  const gameDate = new Date(game.start_date).toLocaleDateString();
  const gameTime = new Date(game.start_date).toLocaleTimeString();  // Calculate game duration
  const startTime = new Date(game.start_date).getTime();
  const endTime = game.end_date ? new Date(game.end_date).getTime() : Date.now();
  
  // Debug log per capire i timestamp
  console.log('GameOver Debug - Calculating duration:');
  console.log('- start_date from DB:', game.start_date);
  console.log('- end_date from DB:', game.end_date);
  console.log('- startTime parsed:', startTime, new Date(startTime));
  console.log('- endTime parsed:', endTime, new Date(endTime));
  
  const durationMs = Math.max(0, endTime - startTime); // Ensure non-negative duration
  console.log('- durationMs:', durationMs);
  
  // Convert to total seconds and then to hours, minutes, seconds
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  console.log('- totalSeconds:', totalSeconds, 'hours:', hours, 'minutes:', minutes, 'seconds:', seconds);
  
  // Format duration string
  let durationString = '';
  if (hours > 0) {
    durationString = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    durationString = `${minutes}m ${seconds}s`;
  } else {
    durationString = `${seconds}s`;
  }
  
  // Add validation for unrealistic durations (more than 2 hours for a game)
  if (hours > 2 || totalSeconds < 0) {
    durationString = 'N/A';
    console.warn('Invalid game duration detected:', durationMs, 'ms');
  }
  
  return (
    <Container className={styles.gameOverContainer}>
      <div className={styles.gameOverHeader}>
        <h2 className={isWon ? styles.winTitle : styles.loseTitle}>
          {isWon ? '🏆 Hai Vinto!' : '😢 Hai Perso!'}
        </h2>
      </div>
      
      <div className={styles.gameOverContent}>
        
        <div className={styles.gameStats}>
          <h3>Statistiche Partita</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Data:</span>
              <span className={styles.statValue}>{gameDate}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Ora:</span>
              <span className={styles.statValue}>{gameTime}</span>
            </div>            <div className={styles.statItem}>
              <span className={styles.statLabel}>Durata:</span>
              <span className={styles.statValue}>{durationString}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Carte raccolte:</span>
              <span className={styles.statValue}>{cards.length}</span>
            </div>            <div className={styles.statItem}>
              <span className={styles.statLabel}>Errori:</span>
              <span className={styles.statValue}>{incorrectAttempts !== undefined ? incorrectAttempts : game.incorrect_attempts}/3</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Risultato:</span>
              <span className={styles.statValue}>{isWon ? 'Vittoria' : 'Sconfitta'}</span>
            </div>
          </div>
        </div>
        
        {cards.length > 0 && (
          <div className={styles.cardsCollection}>
            <CardHand cards={cards} />
          </div>
        )}
      </div>
      
      <div className={styles.gameOverActions}>
        <Button 
          variant="primary" 
          size="lg"
          onClick={onNewGame}
        >
          Nuova Partita
        </Button>
        <Button 
          variant="outline-secondary" 
          size="lg"
          as={Link}
          to="/"
        >
          Torna alla Home
        </Button>
      </div>
    </Container>
  );
};

export default GameOver;
