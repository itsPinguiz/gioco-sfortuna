import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Alert } from 'react-bootstrap';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  useSortable,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameRound.module.css';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Creates a preview array with the new card inserted at the specified position
 * @param {Array} sortedCards - The current sorted cards array
 * @param {Object} newCard - The card to insert
 * @param {number} position - The position where to insert the card
 * @returns {Array} New array with the inserted card
 */
const createPreviewWithNewCard = (sortedCards, newCard, position) => {
  const newArray = [...sortedCards];
  const newCardWithPreview = { 
    ...newCard, 
    id: 'preview-new-card',
    isPreview: true 
  };
  newArray.splice(position, 0, newCardWithPreview);
  return newArray;
};

/**
 * Common drag/drop styling configuration
 * @param {Object} transform - DnD transform object
 * @param {string} transition - CSS transition
 * @param {boolean} isDragging - Whether the item is being dragged
 * @param {number} opacity - Base opacity when dragging
 * @returns {Object} Style object
 */
const getDragStyle = (transform, transition, isDragging, opacity = 0.5) => ({
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? opacity : 1,
});

// ==========================================
// DRAGGABLE COMPONENTS
// ==========================================

/**
 * Sortable card component for cards in the array
 * Handles both regular cards and preview cards
 */
const SortableCard = ({ card, isPreview = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: card.id,
    data: { type: 'existing-card', card }
  });

  const style = getDragStyle(transform, transition, isDragging);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.sortableCard} ${isPreview ? styles.previewCard : ''}`}
    >
      <MisfortuneCard card={card} showIndex={!isPreview} />
    </div>
  );
};

/**
 * Draggable component for the new card to be placed
 */
const DraggableNewCard = ({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: 'new-card',
    data: { type: 'new-card', card }
  });

  const style = {
    ...getDragStyle(transform, transition, isDragging, 0.8),
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  if (!card) {
    return <div>Carta non disponibile</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.draggableNewCard}
    >
      <MisfortuneCard card={card} showIndex={false} />
    </div>
  );
};

/**
 * Drop zone at the end of the array for inserting cards at the last position
 */
const EndDropZone = ({ isOver }) => {
  const { setNodeRef } = useDroppable({
    id: 'end-drop-zone',
    data: { type: 'end-zone' }
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.endDropZone} ${isOver ? styles.endDropZoneActive : ''}`}
    >
      <div className={styles.endDropZoneIndicator}>+</div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GameRound Component
 * Manages a single round of the misfortune card game where users
 * drag and drop a new card into the correct position in the sorted array
 * 
 * @param {Object} roundCard - The card to be positioned this round
 * @param {Array} cards - Array of existing cards in the game
 * @param {Function} onPlaceCard - Callback when card is placed
 * @param {Function} onTimeUp - Callback when time runs out
 * @param {number} timeLeft - Remaining time in seconds
 * @param {number} incorrectAttempts - Number of incorrect attempts so far
 * @param {number} maxAttempts - Maximum allowed attempts
 */
const GameRound = ({ 
  roundCard, 
  cards, 
  onPlaceCard, 
  onTimeUp,
  timeLeft,
  incorrectAttempts = 0,
  maxAttempts = 3
}) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Preview and positioning state
  const [previewCards, setPreviewCards] = useState([]);
  const [insertPosition, setInsertPosition] = useState(null);
  
  // Timer state
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeoutHandled, setTimeoutHandled] = useState(false);
  
  // Drag state
  const [activeId, setActiveId] = useState(null);
  
  // DnD sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  
  /**
   * Cards sorted by misfortune index
   * Uses useMemo to prevent unnecessary recalculations
   */
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
  }, [cards]);

  // ==========================================
  // EFFECTS
  // ==========================================
  
  /**
   * Reset component state when a new round starts
   */
  useEffect(() => {
    setPreviewCards(sortedCards);
    setInsertPosition(null);
    setTimerStarted(false);
    setTimeoutHandled(false);
  }, [roundCard?.id, sortedCards]);

  /**
   * Update preview when insert position is reset
   */
  useEffect(() => {
    if (insertPosition === null) {
      setPreviewCards(sortedCards);
    }
  }, [insertPosition, sortedCards]);

  /**
   * Detect when timer starts (transitions from initial value to counting down)
   */
  useEffect(() => {
    if (timeLeft > 0 && timeLeft < 30 && !timerStarted) {
      setTimerStarted(true);
    }
  }, [timeLeft, timerStarted]);

  /**
   * Handle timeout: either place card at current position or trigger error
   */
  useEffect(() => {
    if (timeLeft === 0 && timerStarted && !timeoutHandled) {
      setTimeoutHandled(true);
      handleTimeUp();
    }
  }, [timeLeft, timerStarted, timeoutHandled]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  
  /**
   * Handles timeout logic - place card if position is set, otherwise trigger error
   */
  const handleTimeUp = () => {
    if (insertPosition !== null) {
      onPlaceCard(roundCard.id, insertPosition);
    } else {
      onTimeUp();
    }
  };

  /**
   * Handles the start of a drag operation
   */
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  /**
   * Handles drag over events to show preview positioning
   */
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // Clear preview if no valid drop target
    if (!over) {
      setPreviewCards(sortedCards);
      setInsertPosition(null);
      return;
    }

    // Only handle dragging of the new card
    if (active.id !== 'new-card') return;

    // Handle drop on end zone
    if (over.id === 'end-drop-zone') {
      const newPreview = createPreviewWithNewCard(sortedCards, roundCard, sortedCards.length);
      setPreviewCards(newPreview);
      setInsertPosition(sortedCards.length);
      return;
    }
    
    // Handle drop on existing card
    const overCard = over.data?.current?.card;
    if (overCard) {
      const overIndex = sortedCards.findIndex(card => card.id === overCard.id);
      if (overIndex !== -1) {
        const newPreview = createPreviewWithNewCard(sortedCards, roundCard, overIndex);
        setPreviewCards(newPreview);
        setInsertPosition(overIndex);
      }
    }
  };

  /**
   * Handles the end of a drag operation
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    // Reset if no valid drop
    if (!over) {
      setPreviewCards(sortedCards);
      setInsertPosition(null);
      return;
    }

    // Only handle dropping of the new card
    if (active.id !== 'new-card') return;

    // Handle drop on end zone
    if (over.id === 'end-drop-zone') {
      const newPreview = createPreviewWithNewCard(sortedCards, roundCard, sortedCards.length);
      setPreviewCards(newPreview);
      setInsertPosition(sortedCards.length);
      return;
    }
    
    // Handle drop on existing card
    const overCard = over.data?.current?.card;
    if (overCard) {
      const overIndex = sortedCards.findIndex(card => card.id === overCard.id);
      if (overIndex !== -1) {
        const newPreview = createPreviewWithNewCard(sortedCards, roundCard, overIndex);
        setPreviewCards(newPreview);
        setInsertPosition(overIndex);
      }
    }
  };

  /**
   * Confirms the current card placement
   */
  const handleConfirm = () => {
    if (insertPosition !== null) {
      onPlaceCard(roundCard.id, insertPosition);
    }
  };

  /**
   * Resets the current card placement preview
   */
  const handleReset = () => {
    setPreviewCards(sortedCards);
    setInsertPosition(null);
  };

  // ==========================================
  // RENDER
  // ==========================================
  
  // Loading state
  if (!roundCard) {
    return (
      <Container className={styles.loadingRound}>
        <Alert variant="info">
          Caricamento della prossima carta...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className={styles.gameRoundContainer}>
      {/* Header with timer and attempts counter */}
      <div className={styles.roundHeader}>
        <div className={styles.attemptsCounter}>
          <span>Errori: {incorrectAttempts}/{maxAttempts}</span>
        </div>
        <div className={styles.roundTitle}>
          <h3>Dove inseriresti questa situazione sfortunata?</h3>
        </div>
        <div className={styles.timer}>
          <div className={styles.timerLabel}>Tempo rimasto:</div>
          <div className={`${styles.timerValue} ${timeLeft <= 10 ? styles.timerLow : ''}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className={styles.roundContent}>
        {/* Control buttons - shown only when position is selected */}
        {insertPosition !== null && (
          <div className={styles.controlButtons}>
            <Button 
              variant="success" 
              onClick={handleConfirm}
              className={styles.confirmButton}
            >
              Conferma Posizione
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleReset}
              className={styles.resetButton}
            >
              Annulla
            </Button>
          </div>
        )}

        {/* Drag and Drop Context */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.verticalLayout}>
            {/* New card section */}
            <div className={styles.newCardSection}>
              <DraggableNewCard card={roundCard} />
            </div>

            {/* Sortable cards array */}
            <div className={styles.sortableContainer}>
              <SortableContext
                items={previewCards.map(card => card.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className={styles.cardArray}>
                  {previewCards.map((card) => (
                    <SortableCard 
                      key={card.id} 
                      card={card} 
                      isPreview={card.isPreview || false}
                    />
                  ))}
                  <EndDropZone />
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Drag overlay for visual feedback */}
          <DragOverlay>
            {activeId === 'new-card' && (
              <div className={styles.dragOverlay}>
                <MisfortuneCard card={roundCard} showIndex={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </Container>
  );
};

export default GameRound;
