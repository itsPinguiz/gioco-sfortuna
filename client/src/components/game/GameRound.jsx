import React from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameRound.module.css';

/**
 * Component to display the current game round
 */
const GameRound = ({ 
  roundCard, 
  cards, 
  onPlaceCard, 
  timeLeft,
  incorrectAttempts = 0,
  maxAttempts = 3
}) => {
  if (!roundCard) {
    return (
      <Container className={styles.loadingRound}>
        <Alert variant="info">
          Caricamento della prossima carta...
        </Alert>
      </Container>
    );
  }
  // Sort cards by misfortune_index
  const sortedCards = [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);

  return (
    <Container className={styles.gameRoundContainer}>
      <div className={styles.roundHeader}>
        <div className={styles.attemptsCounter}>
          <span>Errori: {incorrectAttempts}/{maxAttempts}</span>
        </div>
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
      </div>      <div className={styles.roundContent}>
        <h3>Dove inseriresti questa situazione sfortunata?</h3>
        
        <div className={styles.cardWrapper}>
          <MisfortuneCard card={roundCard} showIndex={false} />
        </div>
        
        {/* Visualizzazione delle carte con pulsanti freccia */}
        <div className={styles.cardScrollContainer}>
          {sortedCards.map((card, index) => (
            <div key={card.id} className={styles.cardPosition}>
              <div className={styles.arrowButtons}>
                <button 
                  className={styles.arrowButton} 
                  onClick={() => onPlaceCard(roundCard.id, index)}
                  title={`Inserisci prima di "${card.name}"`}
                >
                  &#8592;
                </button>
                <button 
                  className={styles.arrowButton}
                  onClick={() => onPlaceCard(roundCard.id, index + 1)}
                  title={`Inserisci dopo "${card.name}"`}
                >
                  &#8594;
                </button>
              </div>
              <MisfortuneCard card={card} showIndex={true} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default GameRound;
