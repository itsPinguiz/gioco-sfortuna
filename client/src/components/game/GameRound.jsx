import React, { useState, useEffect } from 'react';
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
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MisfortuneCard from './MisfortuneCard';
import styles from './GameRound.module.css';

// Draggable new card component
const DraggableNewCard = ({ card }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: 'new-card' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  // Debug: vediamo se la carta ha i dati corretti
  console.log('DraggableNewCard - card:', card);

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

// Drop zone component
const DropZone = ({ position, isActive, onDrop }) => {
  const {
    setNodeRef,
    isOver
  } = useSortable({ 
    id: `drop-zone-${position}`,
    data: { type: 'drop-zone', position }
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dropZone} ${isOver || isActive ? styles.dropZoneActive : ''}`}
      onDrop={() => onDrop(position)}
    >
      <div className={styles.dropIndicator}>
        {isOver ? 'Rilascia qui' : '↓'}
      </div>
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
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Reset selection when a new round starts (new roundCard)
  useEffect(() => {
    setSelectedPosition(null);
    setTimerStarted(false);
  }, [roundCard?.id]);

  // Detect when timer starts (transitions from initial value to started)
  useEffect(() => {
    if (timeLeft > 0 && timeLeft < 30 && !timerStarted) {
      setTimerStarted(true);
    }
  }, [timeLeft, timerStarted]);

  // Handle timeout: use selected position or error
  useEffect(() => {
    if (timeLeft === 0 && timerStarted) {
      handleTimeUp();
    }
  }, [timeLeft, timerStarted, selectedPosition, onPlaceCard, onTimeUp, roundCard?.id]);

  const handleTimeUp = () => {
    if (selectedPosition !== null) {
      onPlaceCard(roundCard.id, selectedPosition);
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

  // Sort cards by misfortune_index
  const sortedCards = [...cards].sort((a, b) => a.misfortune_index - b.misfortune_index);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over && over.data?.current?.type === 'drop-zone') {
      const position = over.data.current.position;
      setSelectedPosition(position);
    }
  };

  const handleDragEnd = (event) => {
    const { over } = event;
    setActiveId(null);
    
    if (over && over.data?.current?.type === 'drop-zone') {
      const position = over.data.current.position;
      setSelectedPosition(position);
    }
  };

  const handleConfirm = () => {
    if (selectedPosition !== null) {
      onPlaceCard(roundCard.id, selectedPosition);
    }
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
        {selectedPosition === null ? (
          <p>Trascina la carta nella posizione desiderata tra le carte esistenti</p>
        ) : (
          <div className={styles.controlButtons}>
            <Button 
              variant="success" 
              onClick={handleConfirm}
              className={styles.confirmButton}
            >
              Conferma
            </Button>
          </div>
        )}        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Layout verticale: carta da indovinare sopra */}
          <div className={styles.verticalLayout}>
            {/* Carta da trascinare in alto */}
            <div className={styles.newCardSection}>
              <DraggableNewCard card={roundCard} />
            </div>

            {/* Carte esistenti disposte orizzontalmente con zone di drop sotto */}
            <div className={styles.cardScrollContainer}>
              {/* Drop zone iniziale */}
              <DropZone 
                position={0} 
                isActive={selectedPosition === 0}
              />

              {sortedCards.map((card, index) => (
                <React.Fragment key={card.id}>
                  <div className={styles.cardPosition}>
                    <MisfortuneCard card={card} showIndex={true} />
                  </div>
                  {/* Drop zone dopo ogni carta */}
                  <DropZone 
                    position={index + 1} 
                    isActive={selectedPosition === index + 1}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeId === 'new-card' ? (
              <div className={styles.dragOverlay}>
                <MisfortuneCard card={roundCard} showIndex={false} />
              </div>
            ) : null}          </DragOverlay>
        </DndContext>
      </div>
    </Container>
  );
};

export default GameRound;
