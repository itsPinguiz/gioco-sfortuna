import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createGame, getUserGames } from '../api/API';
import dayjs from 'dayjs';
import userIcon from '../assets/icons/person.png'
import playIcon from '../assets/icons/play.png'

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Load user's games history if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchGames();
    } else {
      // Clear games and error when not authenticated
      setGames([]);
      setError('');
    }
  }, [isAuthenticated]);

  // Fetch games history
  const fetchGames = async () => {
    // Double check authentication before making the call
    if (!isAuthenticated) {
      console.log('Skipping fetchGames - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const userGames = await getUserGames();
      setGames(userGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      // Check if the error is due to authentication
      if (error.response && error.response.status === 401) {
        console.log('Authentication error when fetching games - user might have been logged out');
        setError('');
        setGames([]);
      } else {
        setError('Errore nel caricamento delle partite. Riprova più tardi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Start a new game
  const handleNewGame = async () => {
    try {
      setLoading(true);
      const gameData = await createGame();

      // Navigate to the game page
      if (gameData.game) {
        navigate(`/game/${gameData.game.id}`);
      } else {
        navigate(`/game/${gameData.id}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Errore nella creazione della partita. Riprova più tardi.');
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Gioco della Sfortuna</h1>
          <p className="lead">
            Metti alla prova la tua capacità di valutare quanto sono sfortunate le situazioni più orribili della vita universitaria!
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={6} className="mb-4 mb-md-0">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Inizia una nuova partita</Card.Title>
              <Card.Text>
                {isAuthenticated
                  ? 'Sfida il computer e cerca di ottenere 6 carte per vincere!'
                  : 'Prova una partita demo con una sola mano. Registrati per giocare partite complete!'}
              </Card.Text>
              <div className="btn-wrapper">
                <Button
                  variant="primary"
                  onClick={handleNewGame}
                  disabled={loading}
                >
                  <span className='icon'>
                    <img src={playIcon} alt="" />
                  </span>
                  {loading ? 'Caricamento...' : 'Nuova Partita'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Come si gioca</Card.Title>
              <Card.Text>
                1. Inizi con 3 carte che hanno un indice di sfortuna da 1 a 100.
                <br />
                2. Ogni round ti viene mostrata una nuova situazione sfortunata.
                <br />
                3. Devi collocare la nuova carta tra quelle che hai, in base a quanto è sfortunata.
                <br />
                4. Hai 30 secondi per decidere!
                <br />
                5. Ottieni 6 carte per vincere. 3 errori e hai perso.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isAuthenticated && (
        <Row className="mt-4">
          <Col>
            <h2>Le tue partite recenti</h2>

            {loading ? (
              <div className="text-center mt-3">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Caricamento...</span>
                </div>
              </div>
            ) : games.length > 0 ? (
              <div className="table-responsive mt-3">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Carte</th>
                      <th>Risultato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr key={game.id}>
                        <td>{dayjs(game.start_date).format('DD/MM/YYYY HH:mm')}</td>
                        <td>{game.cards_count}</td>
                        <td>
                          {!game.end_date ? (
                            <span className="badge bg-warning">In corso</span>
                          ) : game.result === 'won' ? (
                            <span className="badge bg-success">Vittoria</span>
                          ) : (
                            <span className="badge bg-danger">Sconfitta</span>
                          )}
                        </td>
                        <td>
                          {!game.end_date ? (
                            <Link to={`/game/${game.id}`} className="btn btn-sm btn-primary">
                              Continua
                            </Link>
                          ) : (
                            <Link to={`/game/${game.id}`} className="btn btn-sm btn-secondary">
                              Dettagli
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert variant="light">
                Non hai ancora giocato nessuna partita.
              </Alert>
            )}
          </Col>
        </Row>
      )}

      {!isAuthenticated && (
        <Row className="mt-4">
          <Col className="text-center">
            <Card className="border-info">
              <Card.Body>
                <Card.Title>Vuoi accedere a tutte le funzionalità?</Card.Title>
                <Card.Text>
                  Effettua il login per tenere traccia delle tue partite e giocare partite complete!
                </Card.Text>
                <div className="btn-wrapper">
                  <Link to="/login" className="btn btn-primary">
                    <span className="icon"><img src={userIcon} alt="" /></span>Accedi
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default HomePage;
