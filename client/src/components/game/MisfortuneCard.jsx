import React from 'react';
import { Card } from 'react-bootstrap';
import styles from './MisfortuneCard.module.css';

// ==========================================
// CONSTANTS
// ==========================================

const RESULT_TYPES = {
  CORRECT: 'correct',
  INCORRECT: 'incorrect'
};

const RESULT_MARKS = {
  [RESULT_TYPES.CORRECT]: '✓',
  [RESULT_TYPES.INCORRECT]: '✗'
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Determines the appropriate CSS classes for the card based on its state
 * @param {boolean} selectable - Whether the card is selectable
 * @param {string|null} result - The result type ('correct', 'incorrect', or null)
 * @returns {string} Combined CSS class names
 */
const getCardClassName = (selectable, result) => {
  const classes = [styles.misfortuneCard];
  
  if (selectable) {
    classes.push(styles.selectable);
  }
  
  if (result === RESULT_TYPES.CORRECT) {
    classes.push(styles.correctCard);
  } else if (result === RESULT_TYPES.INCORRECT) {
    classes.push(styles.incorrectCard);
  }
  
  return classes.join(' ');
};

/**
 * Validates if the card object has required properties
 * @param {Object} card - The card object to validate
 * @returns {boolean} Whether the card is valid
 */
const isValidCard = (card) => {
  return card && card.name && card.image_url;
};

/**
 * Generates the full image URL for the card
 * @param {string} imageUrl - The relative image URL
 * @returns {string} Full image URL
 */
const getFullImageUrl = (imageUrl) => {
  return `http://localhost:3001${imageUrl}`;
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Card image component
 */
const CardImage = ({ card }) => (
  <Card.Img 
    variant="top" 
    src={getFullImageUrl(card.image_url)} 
    alt={card.name}
    className={styles.cardImage}
  />
);

/**
 * Card body with title component
 */
const CardBody = ({ card }) => (
  <Card.Body className={styles.compactCardBody}>
    <Card.Title className={styles.compactTitle}>
      {card.name}
    </Card.Title>
  </Card.Body>
);

/**
 * Misfortune index display component
 */
const MisfortuneIndex = ({ card, showIndex }) => {
  if (!showIndex || card.misfortune_index === undefined) {
    return null;
  }

  return (
    <div className={styles.misfortuneIndex} title="Indice di sfortuna">
      {card.misfortune_index}
    </div>
  );
};

/**
 * Result overlay component for showing correct/incorrect feedback
 */
const ResultOverlay = ({ result }) => {
  if (!result || !RESULT_MARKS[result]) {
    return null;
  }

  const markClassName = result === RESULT_TYPES.CORRECT 
    ? styles.correctMark 
    : styles.incorrectMark;

  return (
    <div className={styles.resultOverlay}>
      <span className={markClassName}>
        {RESULT_MARKS[result]}
      </span>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * MisfortuneCard Component
 * Displays a single misfortune card with image, title, optional index,
 * and optional result feedback overlay
 * 
 * @param {Object} card - Card object containing name, image_url, and misfortune_index
 * @param {boolean} showIndex - Whether to display the misfortune index
 * @param {Function} onClick - Click handler for the card
 * @param {boolean} selectable - Whether the card should be interactive
 * @param {string|null} result - Result type for feedback ('correct', 'incorrect', or null)
 */
const MisfortuneCard = ({ 
  card, 
  showIndex = true, 
  onClick, 
  selectable = false, 
  result = null
}) => {
  // ==========================================
  // VALIDATION
  // ==========================================
  
  // Early return for invalid card data
  if (!isValidCard(card)) {
    return <div>Carta non disponibile</div>;
  }

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  const cardClassName = getCardClassName(selectable, result);

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <div className={styles.cardWrapper}>
      <Card 
        className={cardClassName}
        onClick={onClick}
      >
        {/* Card title - now at the top */}
        <CardBody card={card} />
        
        {/* Card image - in the middle */}
        <CardImage card={card} />
        
        {/* Misfortune index indicator - at the bottom */}
        <MisfortuneIndex card={card} showIndex={showIndex} />
        
        {/* Result feedback overlay */}
        <ResultOverlay result={result} />
      </Card>
    </div>
  );
};

export default MisfortuneCard;
