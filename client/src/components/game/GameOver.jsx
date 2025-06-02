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
  const gameTime = new Date(game.start_date).toLocaleTimeString();
  
  // Calculate game duration
  const startTime = new Date(game.start_date).getTime();
  const endTime = game.end_date ? new Date(game.end_date).getTime() : Date.now();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  return (
    <Container className={styles.gameOverContainer}>
      <div className={styles.gameOverHeader}>
        <h2 className={isWon ? styles.winTitle : styles.loseTitle}>
          {isWon ? '🏆 Hai Vinto!' : '😢 Hai Perso!'}
        </h2>
      </div>
      
      <div className={styles.gameOverContent}>
        <Alert variant={isWon ? 'success' : 'danger'}>
          <Alert.Heading>
            {isWon 
              ? 'Congratulazioni!' 
              : 'Oh no! La sfortuna ha avuto la meglio.'}
          </Alert.Heading>
          <p>
            {isWon 
              ? 'Hai completato con successo il gioco ordinando correttamente tutte le carte della sfortuna!' 
              : 'Hai commesso troppi errori e la sfortuna si è abbattuta su di te.'}
          </p>
        </Alert>
        
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
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Durata:</span>
              <span className={styles.statValue}>{durationMinutes}m {durationSeconds}s</span>
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
