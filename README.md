[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #1: "Gioco della Sfortuna"
## Student: s309156 ZIZZI STEFANO

## React Client Application Routes

- Route `/`: Homepage con informazioni sul gioco e, per utenti autenticati, lista delle partite passate
- Route `/login`: Pagina di login per gli utenti registrati
- Route `/game/:gameId`: Pagina di gioco, dove `:gameId` è l'ID della partita in corso
- Route `/profile`: Pagina profilo utente (accessibile solo agli utenti autenticati)

## API Server

- POST `/api/sessions`
  - Request body: { username, password }
  - Response body: { id, username, email }
  - Descrizione: Autenticazione dell'utente

- GET `/api/sessions/current`
  - Response body: { id, username, email } o { error: 'Not authenticated' }
  - Descrizione: Verifica se l'utente è autenticato

- DELETE `/api/sessions/current`
  - Response body: {}
  - Descrizione: Logout dell'utente

- POST `/api/games`
  - Response body: { game: { id, user_id, start_date }, cards: [...] }
  - Descrizione: Crea una nuova partita (con o senza utente autenticato)

- GET `/api/games/:id`
  - Response body: { game: { id, user_id, start_date, end_date, result }, cards: [...] }
  - Descrizione: Ottiene i dettagli di una partita specifica

- GET `/api/games`
  - Response body: [{ id, user_id, start_date, end_date, result, cards_count }]
  - Descrizione: Ottiene la lista delle partite dell'utente autenticato

- GET `/api/games/:id/round`
  - Response body: { id, name, image_url } (senza indice di sfortuna)
  - Descrizione: Ottiene una carta casuale per il turno attuale

- POST `/api/games/:id/round`
  - Request body: { cardId, position }
  - Response body: { result: 'correct'|'incorrect', card: {...}, gameCompleted: boolean, gameResult: 'won'|'lost', correctPosition }
  - Descrizione: Sottomette la collocazione di una carta e ottiene il risultato

- POST `/api/games/:id/end`
  - Request body: { result: 'won'|'lost' }
  - Response body: { gameId, result, end_date }
  - Descrizione: Termina una partita con il risultato specificato

## Database Tables

- Table `users` - contiene le informazioni degli utenti registrati
  - id: ID utente
  - email: email dell'utente
  - username: nome utente
  - password: password hashata
  - salt: salt per l'hashing della password

- Table `cards` - contiene le carte delle situazioni sfortunate
  - id: ID della carta
  - name: nome della situazione
  - image_url: percorso dell'immagine
  - misfortune_index: indice di sfortuna (1-100)

- Table `games` - contiene le informazioni sulle partite
  - id: ID della partita
  - user_id: ID dell'utente (null per partite demo)
  - start_date: data di inizio partita
  - end_date: data di fine partita (null se in corso)
  - result: risultato ('won' o 'lost', null se in corso)

- Table `game_cards` - associa le carte alle partite
  - id: ID dell'associazione
  - game_id: ID della partita
  - card_id: ID della carta
  - acquisition_order: ordine di acquisizione nella partita

## Main React Components

- `App` (in `App.jsx`): componente principale che definisce le route e fornisce l'AuthContext

- `AuthContext` (in `AuthContext.jsx`): contesto per la gestione dell'autenticazione

- `NavbarComponent` (in `Navbar.jsx`): barra di navigazione con login/logout

- `MisfortuneCard` (in `Card.jsx`): componente per visualizzare una carta della sfortuna
  
- `CardHand` (in `Card.jsx`): componente per visualizzare la mano di carte del giocatore
  
- `GameRound` (in `Card.jsx`): componente per gestire un round di gioco
  
- `GameResult` (in `Card.jsx`): componente per mostrare il risultato di un round
  
- `GameOver` (in `Card.jsx`): componente per mostrare la schermata di fine partita
  
- `HomePage` (in `HomePage.jsx`): pagina principale con informazioni sul gioco e storico partite
  
- `LoginPage` (in `LoginPage.jsx`): pagina di login

- `GamePage` (in `GamePage.jsx`): pagina principale di gioco

## Screenshots

![Screenshot Partita](./img/game_in_progress.jpg)
![Screenshot Storico](./img/game_history.jpg)

## Users Credentials

- user1, P@ssw0rd1
- user2, P@ssw0rd2
