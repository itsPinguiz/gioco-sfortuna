import React from 'react';
import { Container } from 'react-bootstrap';
import MisfortuneCard from './MisfortuneCard';
import styles from './CardHand.module.css';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Sorts cards by their misfortune index if available
 * @param {Array} cards - Array of cards to sort
 * @returns {Array} Sorted cards array
 */
const sortCardsByIndex = (cards) => {
  return [...cards].sort((a, b) => {
    if (a.misfortune_index !== undefined && b.misfortune_index !== undefined) {
      return a.misfortune_index - b.misfortune_index;
    }
    return 0;
  });
};

/**
 * Validates if cards array is valid and not empty
 * @param {Array} cards - Cards array to validate
 * @returns {boolean} Whether cards array is valid
 */
const hasValidCards = (cards) => {
  return cards && Array.isArray(cards) && cards.length > 0;
};

// ==========================================
// COMPONENT PARTS
// ==========================================

/**
 * Empty hand state component
 */
const EmptyHandState = () => (
  <div className={styles.emptyHand}>
    <p>Non hai ancora nessuna carta nella tua mano.</p>
  </div>
);

/**
 * Hand title component with card count
 */
const HandTitle = ({ cardCount }) => (
  <h3 className={styles.handTitle}>
    Le tue carte ({cardCount})
  </h3>
);

/**
 * Cards grid component
 */
const CardsGrid = ({ cards, onCardSelect, showIndex }) => (
  <div className={styles.cardScroll}>
    <div className={styles.cardHand}>
      {cards.map(card => (
        <MisfortuneCard 
          key={card.id} 
          card={card} 
          onClick={onCardSelect ? () => onCardSelect(card) : undefined}
          selectable={!!onCardSelect}
          showIndex={showIndex}
        />
      ))}
    </div>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * CardHand Component
 * Displays a collection of misfortune cards in a scrollable grid layout.
 * Cards are automatically sorted by their misfortune index when available.
 * 
 * @param {Array} cards - Array of card objects to display
 * @param {Function} onCardSelect - Optional callback when a card is selected
 * @param {boolean} showIndex - Whether to show the misfortune index on cards
 */
const CardHand = ({ 
  cards, 
  onCardSelect, 
  showIndex = false 
}) => {
  // ==========================================
  // VALIDATION
  // ==========================================
  
  // Early return for empty or invalid cards
  if (!hasValidCards(cards)) {
    return <EmptyHandState />;
  }

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  // Sort cards by misfortune index for better organization
  const sortedCards = sortCardsByIndex(cards);

  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <Container className={styles.cardHandContainer}>
      {/* Header with card count */}
      <HandTitle cardCount={cards.length} />
      
      {/* Scrollable cards grid */}
      <CardsGrid 
        cards={sortedCards}
        onCardSelect={onCardSelect}
        showIndex={showIndex}
      />
    </Container>
  );
};

export default CardHand;
