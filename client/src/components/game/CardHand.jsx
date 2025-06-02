import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './CardHand.module.css';

/**
 * Component to display the hand of cards in the game
 */
const CardHand = ({ cards, onCardSelect }) => {
  if (!cards || cards.length === 0) {
    return (
      <div className={styles.emptyHand}>
        <p>Non hai ancora nessuna carta nella tua mano.</p>
      </div>
    );
  }

  // Sort cards by misfortune_index (if available)
  const sortedCards = [...cards].sort((a, b) => {
    if (a.misfortune_index !== undefined && b.misfortune_index !== undefined) {
      return a.misfortune_index - b.misfortune_index;
    }
    return 0;
  });

  return (
    <Container className={styles.cardHandContainer}>
      <h3 className={styles.handTitle}>Le tue carte ({cards.length})</h3>
      <div className={styles.cardScroll}>
        <div className={styles.cardHand}>
          {sortedCards.map(card => (
            <MisfortuneCard 
              key={card.id} 
              card={card} 
              onClick={onCardSelect ? () => onCardSelect(card) : undefined}
              selectable={!!onCardSelect}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

export default CardHand;
