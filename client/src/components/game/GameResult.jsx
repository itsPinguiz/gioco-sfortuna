import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameResult.module.css';

/**
 * Component to display the result of a round
 */
const GameResult = ({ 
  result, 
  card, 
  onContinue 
}) => {
  if (!result || !card) {
    return null;
  }

  const isCorrect = result.result === 'correct';
  const alertVariant = isCorrect ? 'success' : 'danger';
  const alertTitle = isCorrect ? 'Risposta Corretta!' : 'Risposta Sbagliata!';
  const alertMessage = isCorrect 
    ? 'Ottimo lavoro! Hai inserito la carta nella posizione corretta.' 
    : `La posizione corretta era: ${result.correctPosition === 0 ? 'Prima di tutte le carte' : `Dopo la carta in posizione ${result.correctPosition}`}`;

  return (
    <Container className={styles.resultContainer}>
      <Alert variant={alertVariant} className={styles.resultAlert}>
        <Alert.Heading>{alertTitle}</Alert.Heading>
        <p>{alertMessage}</p>
      </Alert>
      
      <div className={styles.cardResult}>
        <MisfortuneCard 
          card={card} 
          showIndex={true} 
          result={isCorrect ? 'correct' : 'incorrect'} 
        />
      </div>
      
      {result.incorrectAttempts !== undefined && !isCorrect && (
        <div className={styles.attemptsInfo}>
          <p>Tentativi errati: {result.incorrectAttempts}/3</p>
        </div>
      )}
      
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
