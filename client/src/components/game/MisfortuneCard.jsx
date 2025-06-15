import React from 'react';
import { Card } from 'react-bootstrap';
import styles from './MisfortuneCard.module.css';

/**
 * Component to display a misfortune card
 */
const MisfortuneCard = ({ 
  card, 
  showIndex = true, 
  onClick, 
  selectable = false, 
  result = null // 'correct', 'incorrect', o null
}) => {
  if (!card) {
    return <div>Carta non disponibile</div>;
  }

  // Determina la classe CSS basata sul risultato
  const getCardClass = () => {
    let className = `${styles.misfortuneCard} ${selectable ? styles.selectable : ''}`;
    if (result === 'correct') className += ` ${styles.correctCard}`;
    if (result === 'incorrect') className += ` ${styles.incorrectCard}`;
    return className;
  };
  
  return (
    <div className={styles.cardWrapper}>
      <Card 
        className={getCardClass()}
        onClick={onClick}
      >
        <Card.Img 
          variant="top" 
          src={`http://localhost:3001${card.image_url}`} 
          alt={card.name}
          className={styles.cardImage}
        />
        <Card.Body className={styles.compactCardBody}>
          <Card.Title className={styles.compactTitle}>{card.name}</Card.Title>          {showIndex && card.misfortune_index !== undefined && (
            <div className={styles.misfortuneIndex} title="Indice di sfortuna">
              {card.misfortune_index}
            </div>
          )}
        </Card.Body>
        
        {/* Overlay di risultato */}
        {result && (
          <div className={styles.resultOverlay}>
            {result === 'correct' ? (
              <span className={styles.correctMark}>✓</span>
            ) : (
              <span className={styles.incorrectMark}>✗</span>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MisfortuneCard;
