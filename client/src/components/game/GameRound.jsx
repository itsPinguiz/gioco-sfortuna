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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameRound.module.css';

// Sortable card component per le carte nell'array
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

// Drop zone alla fine dell'array per permettere inserimento in ultima posizione
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

// Draggable new card component
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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
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
 * Component to display the current game round
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
  // Stato per la preview dell'inserimento
  const [previewCards, setPreviewCards] = useState([]);
  const [insertPosition, setInsertPosition] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeoutHandled, setTimeoutHandled] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Sort cards by misfortune_index - usa useMemo per evitare loop infiniti
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);
  }, [cards]);

  // Reset states when a new round starts
  useEffect(() => {
    setPreviewCards(sortedCards);
    setInsertPosition(null);
    setTimerStarted(false);
    setTimeoutHandled(false);  }, [roundCard?.id, cards]);

  // Update preview when insert position changes
  useEffect(() => {
    if (insertPosition === null) {
      setPreviewCards(sortedCards);
    }
  }, [insertPosition, sortedCards]);
  // Detect when timer starts (transitions from initial value to started)
  useEffect(() => {
    if (timeLeft > 0 && timeLeft < 30 && !timerStarted) {
      setTimerStarted(true);
    }
  }, [timeLeft, timerStarted]);

  // Handle timeout: use insert position or error
  useEffect(() => {
    if (timeLeft === 0 && timerStarted && !timeoutHandled) {
      setTimeoutHandled(true);
      handleTimeUp();
    }
  }, [timeLeft, timerStarted, timeoutHandled]);

  const handleTimeUp = () => {
    if (insertPosition !== null) {
      onPlaceCard(roundCard.id, insertPosition);
    } else {
      onTimeUp();
    }
  };

  if (!roundCard) {
    return (
      <Container className={styles.loadingRound}>
        <Alert variant="info">
          Caricamento della prossima carta...
        </Alert>
      </Container>
    );
  }

  // Crea un array temporaneo che include la nuova carta per il sortable
  const createPreviewWithNewCard = (position) => {
    const newArray = [...sortedCards];
    const newCardWithPreview = { 
      ...roundCard, 
      id: 'preview-new-card',
      isPreview: true 
    };
    newArray.splice(position, 0, newCardWithPreview);
    return newArray;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) {
      // Se non c'è hover, rimuovi la preview
      setPreviewCards(sortedCards);
      setInsertPosition(null);
      return;
    }

    // Se stiamo trascinando la nuova carta
    if (active.id === 'new-card') {
      // Controlla se siamo sopra la zona finale
      if (over.id === 'end-drop-zone') {
        // Inserisci alla fine
        const newPreview = createPreviewWithNewCard(sortedCards.length);
        setPreviewCards(newPreview);
        setInsertPosition(sortedCards.length);
        return;
      }
      
      const overCard = over.data?.current?.card;
      if (overCard) {
        // Trova la posizione della carta over
        const overIndex = sortedCards.findIndex(card => card.id === overCard.id);
        if (overIndex !== -1) {
          // Inserisci prima della carta over
          const newPreview = createPreviewWithNewCard(overIndex);
          setPreviewCards(newPreview);
          setInsertPosition(overIndex);
        }
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) {
      // Reset se non c'è drop valido
      setPreviewCards(sortedCards);
      setInsertPosition(null);
      return;
    }    // Se stiamo rilasciando la nuova carta
    if (active.id === 'new-card') {
      // Controlla se rilasciato sulla zona finale
      if (over.id === 'end-drop-zone') {
        const newPreview = createPreviewWithNewCard(sortedCards.length);
        setPreviewCards(newPreview);
        setInsertPosition(sortedCards.length);
        return;
      }
      
      const overCard = over.data?.current?.card;
      if (overCard) {
        const overIndex = sortedCards.findIndex(card => card.id === overCard.id);
        if (overIndex !== -1) {
          // Mantieni la preview per la conferma
          const newPreview = createPreviewWithNewCard(overIndex);
          setPreviewCards(newPreview);
          setInsertPosition(overIndex);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (insertPosition !== null) {
      onPlaceCard(roundCard.id, insertPosition);
    }
  };

  const handleReset = () => {
    setPreviewCards(sortedCards);
    setInsertPosition(null);
  };  return (
    <Container className={styles.gameRoundContainer}>
      <div className={styles.roundHeader}>
        <div className={styles.attemptsCounter}>
          <span>Errori: {incorrectAttempts}/{maxAttempts}</span>
        </div>
        <div className={styles.roundTitle}>
          <h3>Dove inseriresti questa situazione sfortunata?</h3>
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
      </div>

      <div className={styles.roundContent}>
        {insertPosition == null ? (
          <p></p>
        ) : (
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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.verticalLayout}>
            {/* Carta da trascinare in alto */}
            <div className={styles.newCardSection}>
              <DraggableNewCard card={roundCard} />
            </div>

            {/* Array sortable delle carte */}
            <div className={styles.sortableContainer}>
              <SortableContext
                items={previewCards.map(card => card.id)}
                strategy={horizontalListSortingStrategy}
              >                <div className={styles.cardArray}>
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

          <DragOverlay>
            {activeId === 'new-card' ? (
              <div className={styles.dragOverlay}>
                <MisfortuneCard card={roundCard} showIndex={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Container>
  );
};

export default GameRound;
