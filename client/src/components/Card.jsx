import React from 'react';
import { Container, Card, Row, Col, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styles from './Card.module.css';

// Component to display a misfortune card
const MisfortuneCard = ({
  card,
  showIndex = true,
  onClick,
  selectable = false,
  result = null // 'correct', 'incorrect', o null
}) => {
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
          <Card.Title className={styles.compactTitle}>{card.name}</Card.Title>
          {showIndex && (
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

// Component to display a collection of cards in hand
export const CardHand = ({ cards, showIndices = true }) => {
  return (
    <div className={styles.cardScrollContainer}>
      {cards.map((card) => (
        <div key={card.id}>
          <MisfortuneCard card={card} showIndex={true} />
        </div>
      ))}
    </div>
  );
};

// Component for the game round where player needs to place a card
export const GameRound = ({
  gameCards,
  roundCard,
  onPlaceCard,
  timeLeft,
  roundResult = null, // risultato del round corrente
  onContinue = null // funzione per continuare dopo il risultato
}) => {
  const navigate = useNavigate();

  // Sort cards by misfortune_index if indices are shown (which is during result phase)
  const sortedCards = [...gameCards].sort((a, b) => a.misfortune_index - b.misfortune_index);

  // Function to handle card placement
  const handlePlaceCard = (position) => {
    if (roundResult) return; // Non permettere il posizionamento se c'è già un risultato
    onPlaceCard(roundCard.id, position);
  };

  // Determina il risultato della carta attuale
  const cardResult = roundResult ? roundResult.result : null;

  return (
    <Container className="mt-4">
      <h3 className="mb-3">
        {roundResult ? (
          roundResult.result === 'correct' ? 'Collocazione corretta!' : 'Collocazione errata!'
        ) : (
          'Nuova situazione sfortunata:'
        )}
      </h3>        <Row className="mb-4">
        <Col md={4} className="mx-auto" style={{ position: 'relative' }}>
          <div className={styles.cardContainer}>
            <MisfortuneCard
              card={roundResult ? roundResult.card : roundCard}
              showIndex={!!roundResult} // Mostra l'indice solo dopo il risultato
              result={cardResult}
            />

            {/* Pulsante continua separato dalla carta per evitare sovrapposizioni */}
            {roundResult && (
              <div className={styles.continueButtonContainer}>
                <Button
                  variant="primary"
                  onClick={onContinue}
                  className="mt-4"
                >
                  Continua
                </Button>
              </div>
            )}
          </div>

          {/* Mostra la posizione corretta solo in caso di errore */}
          {roundResult && roundResult.result === 'incorrect' && (
            <div className={styles.correctPositionContainer}>
              <Alert variant="danger" className="text-center">
                <small>
                  La posizione corretta era: {
                    roundResult.correctPosition === 0 ? 'all\'inizio' :
                      `dopo la carta "${gameCards[roundResult.correctPosition - 1]?.name || ''}"`
                  }
                </small>
              </Alert>
            </div>
          )}
        </Col>
      </Row>

      {/* Controlli di posizionamento - mostrati solo se non c'è un risultato */}
      {!roundResult && (
        <>
          <div style={{ overflow: 'hidden', position: 'relative', marginBottom: '10px', textAlign: 'center' }}>
            <button
              className={styles.firstPositionButton}
              onClick={() => handlePlaceCard(0)}
              title="Inserisci la carta all'inizio della sequenza"
            >
              <span>Inserisci all'inizio</span>
              <span className={styles.arrowIcon}>&#8595;</span>
            </button>
          </div>

          {/* Visualizzazione scrollabile orizzontale delle carte con pulsanti freccia */}
          <div className={styles.cardScrollContainer}>
            {sortedCards.map((card, index) => (
              <div key={card.id} className={styles.cardPosition}>
                <div className={styles.arrowButtons}>
                  <button
                    className={styles.arrowButton}
                    onClick={() => handlePlaceCard(index)}
                    title={`Inserisci prima di "${card.name}"`}
                  >
                    &#8592;
                  </button>
                  <button
                    className={styles.arrowButton}
                    onClick={() => handlePlaceCard(index + 1)}
                    title={`Inserisci dopo "${card.name}"`}
                  >
                    &#8594;
                  </button>
                </div>
                <MisfortuneCard card={card} showIndex={true} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Se c'è un risultato e non ci sono ancora carte, mostriamo informazioni aggiuntive */}
      {roundResult && gameCards.length === 0 && (
        <div className="text-center mt-3">
          <p>Questa è la prima carta della tua sequenza.</p>
        </div>
      )}

      {/* Se c'è un risultato, mostriamo le carte già posizionate */}
      {roundResult && gameCards.length > 0 && (
        <div className="mt-4">
          <h5>La tua sequenza attuale:</h5>
          <div className={styles.cardScrollContainer}>
            {sortedCards.map((card) => (
              <div key={card.id}>
                <MisfortuneCard card={card} showIndex={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

// Component to show the game result - Migliorato per gestire meglio i timeout
export const GameResult = ({ result, card, correctPosition, gameCards, onContinue, incorrectAttempts }) => {
  // Verifichiamo se si tratta di un timeout in base a qualsiasi di questi criteri
  const isTimeout = !card.misfortune_index || card.timeout === true;

  return (
    <Container className="mt-4">
      {result === 'correct' ? (
        <Alert variant="success">
          <h3>Hai indovinato!</h3>
          <p>La carta è stata collocata correttamente.</p>
        </Alert>
      ) : (
        <Alert variant="danger" className={isTimeout ? "timeout-alert" : ""}>
          <h3>{isTimeout ? '⏱️ Tempo scaduto!' : '❌ Collocazione errata!'}</h3>
          <p>La posizione corretta era: {
            correctPosition === 0 ? 'all\'inizio' :
              `dopo la carta "${gameCards[correctPosition - 1]?.name || ''}"`
          }</p>
          {incorrectAttempts !== undefined && (
            <p className="mt-2">
              <strong>Tentativi errati:</strong> <span className="error-count">{incorrectAttempts}/3</span>
            </p>
          )}
        </Alert>
      )}

      <h4 className="mb-3">Dettagli della carta:</h4>
      <Row className="mb-4">
        <Col md={4} className="mx-auto">
          <MisfortuneCard card={card} showIndex={true} />
        </Col>
      </Row>

      <Button variant="primary" onClick={onContinue} className="mb-4">
        Continua
      </Button>
    </Container>
  );
};

// Component to show the game over screen
export const GameOver = ({ won, cards, onNewGame }) => {
  const navigate = useNavigate();
  return (
    <Container className="mt-4">
      {won ? (
        <Alert variant="success">
          <h2>Hai Vinto!</h2>
          <p>Complimenti! Hai raggiunto 6 carte e hai completato il gioco.</p>
        </Alert>
      ) : (
        <Alert variant="danger">
          <h2>Hai Perso!</h2>
          <p>Hai commesso troppi errori. Meglio la prossima volta!</p>
        </Alert>)}

      <h3 className="mb-3">Sequenza finale:</h3>
      <CardHand cards={cards} showIndices={true} />

      <div className="d-flex justify-content-between mt-4">
        <div className="btn-wrapper">
          <Button variant="primary" onClick={onNewGame}>
            Nuova Partita
          </Button>
        </div>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Torna alla Home
        </Button>
      </div>
    </Container>
  );
};

export default MisfortuneCard;
