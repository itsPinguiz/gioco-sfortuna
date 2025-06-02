import React from 'react';
import { Container, Button } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameResult.module.css';

/**
 * Component to display the result of a round
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
  if (!result || !card) {
    return null;
  }
  const isCorrect = result.result === 'correct';

  return (
    <Container className={styles.resultContainer}>
      {/* Header with timer and attempts counter - consistent with GameRound */}
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
      </div>      <div className={styles.cardResult}>
        <MisfortuneCard 
          card={card} 
          showIndex={!isCorrect} /* Mostra l'indice solo quando è sbagliato */
          result={isCorrect ? 'correct' : 'incorrect'} 
        />
      </div>
      
      <div className={styles.actionButtons}>
        <Button
          variant={isCorrect ? 'success' : 'primary'}
          onClick={onContinue}
        >
          {isCorrect ? 'Continua' : 'Prossima carta'}
        </Button>
      </div>
    </Container>
  );
};

export default GameResult;
